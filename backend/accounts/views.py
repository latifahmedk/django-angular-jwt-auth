
from rest_framework import generics, permissions, viewsets, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Employee
from .serializers import RegisterSerializer, EmployeeSerializer


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class ProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({
            "id": request.user.id,
            "username": request.user.username,
            "email": request.user.email,
        })


class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all().order_by('-id')
    serializer_class = EmployeeSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['first_name', 'last_name', 'email', 'department', 'position', 'status', 'phone']
    ordering_fields = ['id', 'first_name', 'last_name', 'email', 'salary', 'department', 'created_at']

