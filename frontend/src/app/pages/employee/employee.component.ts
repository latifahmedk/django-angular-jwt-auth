import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Employee, EmployeeFormData } from '../../core/models/employee.model';
import { EmployeeService } from '../../core/services/employee.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-employee',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './employee.component.html',
  styleUrl: './employee.component.css'
})
export class EmployeeComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly employeeService = inject(EmployeeService);
  private readonly notification = inject(NotificationService);
  protected readonly authService = inject(AuthService);

  // State signals
  protected readonly employees = signal<Employee[]>([]);
  protected readonly isLoading = signal<boolean>(true);
  protected readonly isSaving = signal<boolean>(false);
  protected readonly isDeleting = signal<boolean>(false);
  protected readonly searchTerm = signal<string>('');
  protected readonly selectedDepartment = signal<string>('All');
  protected readonly selectedStatus = signal<string>('All');

  // Modal controls
  protected readonly showModal = signal<boolean>(false);
  protected readonly isEditMode = signal<boolean>(false);
  protected readonly editingEmployeeId = signal<number | null>(null);

  // Delete confirmation modal
  protected readonly showDeleteModal = signal<boolean>(false);
  protected readonly employeeToDelete = signal<Employee | null>(null);

  // Available options
  protected readonly departments: string[] = [
    'Engineering',
    'Design',
    'Product',
    'Marketing',
    'Human Resources',
    'Finance',
    'Operations',
    'Sales'
  ];

  protected readonly statusOptions: string[] = [
    'Active',
    'Remote',
    'On Leave',
    'Inactive'
  ];

  // Form definition
  protected employeeForm: FormGroup = this.fb.group({
    first_name: ['', [Validators.required, Validators.maxLength(100)]],
    last_name: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    department: ['Engineering', [Validators.required]],
    position: ['', [Validators.required, Validators.maxLength(100)]],
    salary: [75000, [Validators.required, Validators.min(0)]],
    status: ['Active', [Validators.required]],
    hire_date: [new Date().toISOString().substring(0, 10)]
  });

  // Filtered employees computed signal
  protected readonly filteredEmployees = computed(() => {
    const list = this.employees();
    const query = this.searchTerm().toLowerCase().trim();
    const dept = this.selectedDepartment();
    const stat = this.selectedStatus();

    return list.filter(emp => {
      const matchesDept = dept === 'All' || emp.department === dept;
      const matchesStatus = stat === 'All' || emp.status === stat;

      if (!matchesDept || !matchesStatus) return false;

      if (!query) return true;

      const fullName = `${emp.first_name} ${emp.last_name}`.toLowerCase();
      const email = (emp.email || '').toLowerCase();
      const position = (emp.position || '').toLowerCase();
      const department = (emp.department || '').toLowerCase();
      const phone = (emp.phone || '').toLowerCase();
      const status = (emp.status || '').toLowerCase();

      return (
        fullName.includes(query) ||
        email.includes(query) ||
        position.includes(query) ||
        department.includes(query) ||
        phone.includes(query) ||
        status.includes(query)
      );
    });
  });

  // Key metrics
  protected readonly totalCount = computed(() => this.employees().length);
  protected readonly activeCount = computed(() =>
    this.employees().filter(e => e.status === 'Active' || e.status === 'Remote').length
  );
  protected readonly departmentCount = computed(() => {
    const depts = new Set(this.employees().map(e => e.department));
    return depts.size;
  });
  protected readonly avgSalary = computed(() => {
    const list = this.employees();
    if (list.length === 0) return 0;
    const sum = list.reduce((acc, curr) => acc + Number(curr.salary || 0), 0);
    return Math.round(sum / list.length);
  });

  ngOnInit(): void {
    this.loadEmployees();
  }

  loadEmployees(): void {
    this.isLoading.set(true);
    this.employeeService.getEmployees().subscribe({
      next: (data) => {
        this.employees.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.notification.error('Failed to load employee directory from server.', 'Load Error');
      }
    });
  }

  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm.set(target.value);
  }

  clearSearch(): void {
    this.searchTerm.set('');
    this.selectedDepartment.set('All');
    this.selectedStatus.set('All');
  }

  openCreateModal(): void {
    this.isEditMode.set(false);
    this.editingEmployeeId.set(null);
    this.employeeForm.reset({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      department: 'Engineering',
      position: '',
      salary: 75000,
      status: 'Active',
      hire_date: new Date().toISOString().substring(0, 10)
    });
    this.showModal.set(true);
  }

  openEditModal(employee: Employee): void {
    this.isEditMode.set(true);
    this.editingEmployeeId.set(employee.id ?? null);
    this.employeeForm.patchValue({
      first_name: employee.first_name,
      last_name: employee.last_name,
      email: employee.email,
      phone: employee.phone || '',
      department: employee.department,
      position: employee.position,
      salary: employee.salary,
      status: employee.status,
      hire_date: employee.hire_date || ''
    });
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.isEditMode.set(false);
    this.editingEmployeeId.set(null);
  }

  saveEmployee(): void {
    if (this.employeeForm.invalid) {
      this.employeeForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    const formVal = this.employeeForm.value as EmployeeFormData;

    if (this.isEditMode() && this.editingEmployeeId()) {
      const id = this.editingEmployeeId()!;
      this.employeeService.updateEmployee(id, formVal).subscribe({
        next: (updated) => {
          this.isSaving.set(false);
          this.employees.update(list => list.map(e => e.id === id ? updated : e));
          this.closeModal();
          this.notification.success(
            `Employee "${updated.first_name} ${updated.last_name}" updated successfully!`,
            'Updated'
          );
        },
        error: (err) => {
          this.isSaving.set(false);
          const errorMsg = err.error?.email?.[0] || 'Failed to update employee details.';
          this.notification.error(errorMsg, 'Update Error');
        }
      });
    } else {
      this.employeeService.createEmployee(formVal).subscribe({
        next: (created) => {
          this.isSaving.set(false);
          this.employees.update(list => [created, ...list]);
          this.closeModal();
          this.notification.success(
            `Employee "${created.first_name} ${created.last_name}" added successfully!`,
            'Employee Created'
          );
        },
        error: (err) => {
          this.isSaving.set(false);
          const errorMsg = err.error?.email?.[0] || 'Failed to create employee. Check if email is unique.';
          this.notification.error(errorMsg, 'Creation Error');
        }
      });
    }
  }

  openDeleteModal(employee: Employee): void {
    this.employeeToDelete.set(employee);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.employeeToDelete.set(null);
  }

  confirmDelete(): void {
    const employee = this.employeeToDelete();
    if (!employee || !employee.id) return;

    this.isDeleting.set(true);
    this.employeeService.deleteEmployee(employee.id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.employees.update(list => list.filter(e => e.id !== employee.id));
        this.closeDeleteModal();
        this.notification.success(
          `Employee "${employee.first_name} ${employee.last_name}" deleted.`,
          'Employee Removed'
        );
      },
      error: () => {
        this.isDeleting.set(false);
        this.notification.error('Failed to remove employee record.', 'Delete Error');
      }
    });
  }

  getInitials(firstName: string, lastName: string): string {
    const first = firstName ? firstName.charAt(0).toUpperCase() : '';
    const last = lastName ? lastName.charAt(0).toUpperCase() : '';
    return first + last || 'EM';
  }

  getDepartmentClass(department: string): string {
    switch (department) {
      case 'Engineering':
        return 'badge-blue';
      case 'Design':
        return 'badge-orange';
      case 'Product':
        return 'badge-purple';
      case 'Marketing':
        return 'badge-pink';
      case 'Human Resources':
        return 'badge-teal';
      case 'Finance':
        return 'badge-green';
      default:
        return 'badge-slate';
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Active':
        return 'status-active';
      case 'Remote':
        return 'status-remote';
      case 'On Leave':
        return 'status-leave';
      case 'Inactive':
        return 'status-inactive';
      default:
        return 'status-active';
    }
  }
}
