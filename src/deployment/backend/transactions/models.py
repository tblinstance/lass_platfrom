from django.db import models

class Transaction(models.Model):
    uuid = models.CharField(max_length=255, unique=True)
    status = models.CharField(max_length=50, null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.uuid

class DepositRequest(models.Model):
    METHOD_CHOICES = (
        ('bkash', 'bKash'),
        ('nagad', 'Nagad'),
        ('rocket', 'Rocket'),
    )
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
    )
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='deposits')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    method = models.CharField(max_length=20, choices=METHOD_CHOICES)
    sender_number = models.CharField(max_length=20, default="")
    tnx_id = models.CharField(max_length=100, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    is_applied = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.method} - {self.amount} - {self.status}"

from django.db.models.signals import post_save
from django.dispatch import receiver

class WithdrawRequest(models.Model):
    METHOD_CHOICES = (
        ('bkash', 'bKash'),
        ('nagad', 'Nagad'),
        ('rocket', 'Rocket'),
        ('bank', 'Bank Transfer'),
    )
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
    )
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='withdrawals')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    method = models.CharField(max_length=20, choices=METHOD_CHOICES)
    account_details = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    is_refunded = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - Withdraw - {self.amount} - {self.status}"

@receiver(post_save, sender=DepositRequest)
def update_user_balance_on_verify(sender, instance, created, **kwargs):
    if instance.status == 'verified' and not instance.is_applied:
        user = instance.user
        import decimal
        user.balance += decimal.Decimal(str(instance.amount))
        user.save()
        instance.is_applied = True
        instance.save(update_fields=['is_applied'])

@receiver(post_save, sender=WithdrawRequest)
def handle_withdraw_rejection(sender, instance, created, **kwargs):
    # If the admin rejects the withdrawal, refund the balance to the user
    if instance.status == 'rejected' and not instance.is_refunded:
        user = instance.user
        import decimal
        user.balance += decimal.Decimal(str(instance.amount))
        user.save()
        instance.is_refunded = True
        instance.save(update_fields=['is_refunded'])
