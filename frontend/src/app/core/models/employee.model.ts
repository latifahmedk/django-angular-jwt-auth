export interface Employee {
  id?: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  department: string;
  position: string;
  salary: number | string;
  status: 'Active' | 'On Leave' | 'Remote' | 'Inactive' | string;
  hire_date?: string;
  created_at?: string;
  updated_at?: string;
}

export type EmployeeFormData = Omit<Employee, 'id' | 'created_at' | 'updated_at'>;

