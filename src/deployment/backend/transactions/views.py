from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework import status
from backend.tblinc_client import TblincClient
from backend.utils import serialize_data
from .models import Transaction
from .serializers import TransactionSerializer
import logging

logger = logging.getLogger(__name__)

class TransactionsViewSet(viewsets.ViewSet):
    """
    ViewSet for listing and retrieving async Incus operations (transactions).
    Supports list, retrieve, and destroy (cancel).
    """
    lookup_field = 'uuid'

    def list(self, request):
        try:
            with TblincClient() as client:
                ops_data = client.list_operations(recursion=1)
                serialized = serialize_data(Transaction, TransactionSerializer, ops_data.get("metadata", []), many=True)
                return Response(serialized, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception("Failed to list transactions/operations")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def retrieve(self, request, uuid=None):
        try:
            with TblincClient() as client:
                op_data = client.get_operation(uuid)
                serialized = serialize_data(Transaction, TransactionSerializer, op_data.get("metadata", {}), many=False)
                return Response(serialized, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception(f"Failed to get transaction/operation {uuid}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def destroy(self, request, uuid=None):
        try:
            with TblincClient() as client:
                client.cancel_operation(uuid)
                return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.exception(f"Failed to cancel transaction/operation {uuid}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

from rest_framework.decorators import action
from .models import DepositRequest, WithdrawRequest
from .serializers import DepositRequestSerializer, WithdrawRequestSerializer

class AdminBillingRequestsViewSet(viewsets.ViewSet):
    """
    ViewSet for admins to list and verify deposit and withdraw requests.
    """
    def list(self, request):
        if not request.user.is_authenticated or (not request.user.is_staff and not request.user.is_superuser):
            return Response({"detail": "You do not have permission to perform this action."}, status=status.HTTP_403_FORBIDDEN)
            
        deposits = DepositRequest.objects.all().order_by('-created_at')
        withdrawals = WithdrawRequest.objects.all().order_by('-created_at')
        
        dep_data = DepositRequestSerializer(deposits, many=True).data
        with_data = WithdrawRequestSerializer(withdrawals, many=True).data
        
        # Standardize format for frontend
        combined = []
        for d in dep_data:
            combined.append({
                "id": d["id"],
                "type": "deposit",
                "user": d["user"],
                "amount": d["amount"],
                "method": d["method"],
                "status": d["status"],
                "details": f"TNX: {d.get('tnx_id')} | Sender: {d.get('sender_number')}",
                "created_at": d["created_at"]
            })
            
        for w in with_data:
            combined.append({
                "id": w["id"],
                "type": "withdraw",
                "user": w["user"],
                "amount": w["amount"],
                "method": w["method"],
                "status": w["status"],
                "details": f"Account: {w.get('account_details')}",
                "created_at": w["created_at"]
            })
            
        # Sort combined list by created_at descending
        combined.sort(key=lambda x: x["created_at"], reverse=True)
        return Response(combined, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def verify(self, request):
        if not request.user.is_authenticated or (not request.user.is_staff and not request.user.is_superuser):
            return Response({"detail": "You do not have permission to perform this action."}, status=status.HTTP_403_FORBIDDEN)
            
        req_id = request.data.get("id")
        req_type = request.data.get("type")
        new_status = request.data.get("status") # 'verified' or 'rejected'
        
        if req_type not in ["deposit", "withdraw"] or new_status not in ["verified", "rejected"]:
            return Response({"error": "Invalid payload"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            if req_type == "deposit":
                obj = DepositRequest.objects.get(id=req_id)
            else:
                obj = WithdrawRequest.objects.get(id=req_id)
                
            if obj.status != "pending":
                return Response({"error": "Request is already processed"}, status=status.HTTP_400_BAD_REQUEST)
                
            obj.status = new_status
            obj.save()
            return Response({"message": f"{req_type.capitalize()} request {new_status} successfully."}, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
