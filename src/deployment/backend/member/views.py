from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import action
from django.contrib.auth import get_user_model
from backend.tblinc_client import TblincClient
from networking.models import DnsRule
import logging

logger = logging.getLogger(__name__)
User = get_user_model()

class MemberDashboardViewSet(viewsets.ViewSet):
    """
    ViewSet for retrieving member-specific dashboard statistics inside their project namespace.
    """
    def list(self, request):
        if not request.user.is_authenticated:
            return Response({"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)

        # Non-staff / standard users can check their own dashboard
        user = request.user
        project_name = f"member-{user.username}".lower().replace('_', '-').replace('.', '-')

        try:
            stats = {
                "username": user.username,
                "email": user.email,
                "project_name": project_name,
                "instances": {
                    "total": 0,
                    "running": 0,
                    "stopped": 0,
                    "cpu_allocated": 0,
                    "memory_allocated_mb": 0
                },
                "networks_count": 0,
                "storage_volumes_count": 0,
                "dns_rules_count": DnsRule.objects.filter(project=project_name).count(),
            }

            # Query Incus resources for the member project
            with TblincClient(project=project_name) as client:
                # 1. Instances stats
                try:
                    instances_data = client.list_instances(recursion=1)
                    instances = instances_data.get("metadata", [])
                    stats["instances"]["total"] = len(instances)
                    
                    running_count = 0
                    stopped_count = 0
                    cpu_allocated = 0
                    memory_allocated_mb = 0

                    for inst in instances:
                        if inst.get("status") == "Running":
                            running_count += 1
                        else:
                            stopped_count += 1
                        
                        # Parse CPU
                        cpu_limit = inst.get("config", {}).get("limits.cpu", "1")
                        try:
                            cpu_allocated += int(cpu_limit)
                        except ValueError:
                            cpu_allocated += 1
                        
                        # Parse Memory (e.g. 512MB, 2GB)
                        mem_limit = inst.get("config", {}).get("limits.memory", "1GB").upper()
                        try:
                            if "GB" in mem_limit:
                                memory_allocated_mb += int(mem_limit.replace("GB", "").strip()) * 1024
                            elif "MB" in mem_limit:
                                memory_allocated_mb += int(mem_limit.replace("MB", "").strip())
                            else:
                                memory_allocated_mb += 1024
                        except ValueError:
                            memory_allocated_mb += 1024

                    stats["instances"]["running"] = running_count
                    stats["instances"]["stopped"] = stopped_count
                    stats["instances"]["cpu_allocated"] = cpu_allocated
                    stats["instances"]["memory_allocated_mb"] = memory_allocated_mb

                except Exception as e:
                    logger.warning(f"Failed to fetch member instances from project {project_name}: {e}")
                    # Allow non-provisioned namespaces to fall back cleanly
                    pass

                # 2. Networks stats
                try:
                    networks_data = client.list_networks(recursion=1)
                    stats["networks_count"] = len(networks_data.get("metadata", []))
                except Exception as e:
                    pass

                # 3. Storage pools / volumes stats
                try:
                    # In client, we can fetch storage volumes in default pool for this project
                    volumes_data = client.list_storage_volumes(pool="local")
                    stats["storage_volumes_count"] = len(volumes_data.get("metadata", []))
                except Exception as e:
                    pass

            return Response(stats, status=status.HTTP_200_OK)

        except Exception as e:
            logger.exception(f"Failed to build member dashboard stats for {user.email}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MemberBillingViewSet(viewsets.ViewSet):
    def list(self, request):
        if not request.user.is_authenticated:
            return Response({"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)
        
        user = request.user
        project_name = f"member-{user.username}".lower().replace('_', '-').replace('.', '-')
        
        try:
            total_price = 0.0
            highest_tier = "Free"
            tier_weights = {"Free": 0, "Pro": 1, "Advance": 2}
            
            with TblincClient(project=project_name) as client:
                try:
                    instances_data = client.list_instances(recursion=1)
                    instances = instances_data.get("metadata", [])
                    
                    for inst in instances:
                        profiles = inst.get("profiles", [])
                        if "advance" in profiles:
                            total_price += 49.00
                            if tier_weights["Advance"] > tier_weights[highest_tier]:
                                highest_tier = "Advance"
                        elif "pro" in profiles:
                            total_price += 15.00
                            if tier_weights["Pro"] > tier_weights[highest_tier]:
                                highest_tier = "Pro"
                except Exception:
                    pass
                            
            import datetime
            current_month = datetime.datetime.now()
            bills = [
                {
                    "id": f"INV-{current_month.strftime('%Y%m')}",
                    "date": current_month.strftime('%Y-%m-01'),
                    "amount": f"${total_price:.2f}",
                    "status": "Pending" if total_price > 0 else "Paid"
                }
            ]
            
            return Response({
                "active_tier": highest_tier,
                "total_monthly": f"${total_price:.2f}",
                "bills": bills,
                "balance": float(user.balance)
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.exception("Failed to build billing data")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def add_balance(self, request):
        if not request.user.is_authenticated:
            return Response({"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            import decimal
            amount = float(request.data.get('amount', 0))
            if amount <= 0:
                return Response({"error": "Amount must be positive"}, status=status.HTTP_400_BAD_REQUEST)
                
            user = request.user
            user.balance += decimal.Decimal(str(amount))
            user.save()
            
            return Response({
                "message": f"Successfully added ${amount:.2f} to balance",
                "balance": float(user.balance)
            }, status=status.HTTP_200_OK)
        except ValueError:
            return Response({"error": "Invalid amount provided"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.exception("Failed to add balance")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def withdraw_balance(self, request):
        if not request.user.is_authenticated:
            return Response({"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            import decimal
            amount = float(request.data.get('amount', 0))
            method = request.data.get('method')
            account_details = request.data.get('account_details')
            
            if amount <= 0:
                return Response({"error": "Amount must be positive"}, status=status.HTTP_400_BAD_REQUEST)
            if not method:
                return Response({"error": "Withdrawal method is required"}, status=status.HTTP_400_BAD_REQUEST)
            if not account_details:
                return Response({"error": "Account details (e.g. mobile number) are required"}, status=status.HTTP_400_BAD_REQUEST)
                
            user = request.user
            dec_amount = decimal.Decimal(str(amount))
            
            if user.balance < dec_amount:
                return Response({"error": "Insufficient balance"}, status=status.HTTP_400_BAD_REQUEST)
                
            from transactions.models import WithdrawRequest
            
            # Create pending request
            WithdrawRequest.objects.create(
                user=user,
                amount=amount,
                method=method,
                account_details=account_details,
                status='pending'
            )
            
            # Deduct balance immediately
            user.balance -= dec_amount
            user.save()
            
            return Response({
                "message": f"Withdrawal request for ${amount:.2f} submitted successfully. Pending verification.",
                "balance": float(user.balance)
            }, status=status.HTTP_200_OK)
        except ValueError:
            return Response({"error": "Invalid amount provided"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.exception("Failed to withdraw balance")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def submit_mobile_deposit(self, request):
        if not request.user.is_authenticated:
            return Response({"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            amount = float(request.data.get('amount', 0))
            method = request.data.get('method')
            sender_number = request.data.get('sender_number')
            tnx_id = request.data.get('tnx_id')
            
            if amount <= 0:
                return Response({"error": "Amount must be positive"}, status=status.HTTP_400_BAD_REQUEST)
            if not method or method not in ['bkash', 'nagad', 'rocket']:
                return Response({"error": "Invalid or missing payment method"}, status=status.HTTP_400_BAD_REQUEST)
            if not sender_number:
                return Response({"error": "Sender number is required"}, status=status.HTTP_400_BAD_REQUEST)
            if not tnx_id:
                return Response({"error": "Transaction ID (TrxID) is required"}, status=status.HTTP_400_BAD_REQUEST)
                
            from transactions.models import DepositRequest
            
            if DepositRequest.objects.filter(tnx_id=tnx_id).exists():
                return Response({"error": "This Transaction ID has already been submitted"}, status=status.HTTP_400_BAD_REQUEST)
                
            DepositRequest.objects.create(
                user=request.user,
                amount=amount,
                method=method,
                sender_number=sender_number,
                tnx_id=tnx_id,
                status='pending'
            )
            
            return Response({
                "message": f"Deposit request for ${amount:.2f} via {method.capitalize()} submitted successfully. It is pending verification."
            }, status=status.HTTP_200_OK)
        except ValueError:
            return Response({"error": "Invalid amount provided"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.exception("Failed to submit mobile deposit")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
