from django.db import models
from django.contrib.auth.models import User
import uuid

class UserProfile(models.Model):
    """
    Extended user model following standard practices.
    Uses UUIDs for security and JSONField for flexible preferences.
    """
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('editor', 'Editor'),
        ('user', 'User')
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='user')
    preferences = models.JSONField(default=dict, blank=True, help_text="User specific feed preferences")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.role}"
