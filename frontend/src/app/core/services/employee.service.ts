import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Employee, EmployeeFormData } from '../models/employee.model';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:8000/api/employees';

  getEmployees(searchQuery?: string): Observable<Employee[]> {
    let params = new HttpParams();
    if (searchQuery && searchQuery.trim().length > 0) {
      params = params.set('search', searchQuery.trim());
    }
    return this.http.get<Employee[]>(`${this.API_URL}/`, { params });
  }

  getEmployee(id: number): Observable<Employee> {
    return this.http.get<Employee>(`${this.API_URL}/${id}/`);
  }

  createEmployee(employee: EmployeeFormData): Observable<Employee> {
    return this.http.post<Employee>(`${this.API_URL}/`, employee);
  }

  updateEmployee(id: number, employee: Partial<EmployeeFormData>): Observable<Employee> {
    return this.http.put<Employee>(`${this.API_URL}/${id}/`, employee);
  }

  deleteEmployee(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}/`);
  }
}

