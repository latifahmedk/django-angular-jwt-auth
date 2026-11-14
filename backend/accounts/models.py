from django.db import models


class Employee(models.Model):
    DEPARTMENT_CHOICES = [
        ('Engineering', 'Engineering'),
        ('Design', 'Design'),
        ('Product', 'Product'),
        ('Marketing', 'Marketing'),
        ('Human Resources', 'Human Resources'),
        ('Finance', 'Finance'),
        ('Operations', 'Operations'),
        ('Sales', 'Sales'),
    ]

    STATUS_CHOICES = [
        ('Active', 'Active'),
        ('On Leave', 'On Leave'),
        ('Remote', 'Remote'),
        ('Inactive', 'Inactive'),
    ]

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=25, blank=True, default='')
    department = models.CharField(max_length=50, choices=DEPARTMENT_CHOICES, default='Engineering')
    position = models.CharField(max_length=100)
    salary = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Active')
    hire_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-id']

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.position})"

