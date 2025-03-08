import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-form',
  imports: [ReactiveFormsModule,CommonModule],
  templateUrl: './form.component.html',
  styleUrl: './form.component.css'
})
export class FormComponent {

   uploadForm: FormGroup;
  selectedFile: File | null = null;
  errorMessage: string = '';

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.uploadForm = this.fb.group({
      author: [null, [Validators.required, Validators.minLength(3)]]
    });
  }

  onFileSelect(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        this.errorMessage = 'File size must not exceed 50MB!';
        this.selectedFile = null;
      } else if (/\s/.test(file.name)) {
        this.errorMessage = 'File name should not contain spaces!';
        this.selectedFile = null;
      } else {
        this.errorMessage = '';
        this.selectedFile = file;
      }
    }
  }

  onUpload() {
    if (!this.selectedFile || this.uploadForm.invalid) {
      this.errorMessage = 'Please select a valid file and fill in all fields!';
      return;
    }

    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('author', this.uploadForm.value.author);

    this.http.post<{ message: string }>('http://localhost:8080/api/documents/upload', formData)
      .subscribe({
        next: (response) => {
          alert(response.message);
          this.uploadForm.reset();
          this.selectedFile = null;
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Upload failed!';
        }
      });
  }
}