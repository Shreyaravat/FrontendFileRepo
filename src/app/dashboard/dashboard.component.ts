import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { CalendarModule } from 'primeng/calendar';
import { ConfirmationService, MessageService } from 'primeng/api';
import { HttpClient } from '@angular/common/http';
import { DocumentService } from '../services/document.service';
 
export interface Document {
  id: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  author: string;
  uploadedAt: string;
  addedDate: string;  

}
 
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DialogModule,
    InputTextModule,
    ButtonModule,
    TableModule,
    CalendarModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  providers: [MessageService, ConfirmationService],
  encapsulation:ViewEncapsulation.None
})
export class DashboardComponent implements OnInit {
  documents: Document[] = [];
  filteredDocuments: Document[] = [];
  filters = { fileName: '', author: '', dateRange: [null, null] as [Date | null, Date | null] };
 
  displayDialog: boolean = false;
  isEditing: boolean = false;
  selectedDocument: Document = {} as Document;
  dialogTitle: string = '';
 
  uploadForm: FormGroup;
  selectedFile: File | null = null;
  errorMessage: string = '';
  allFilesLog: Document[] = [];
  displayLogDialog: boolean = false;

 
  constructor(private documentService: DocumentService, private fb: FormBuilder, private http: HttpClient) {
    this.uploadForm = this.fb.group({
      author: [null, [Validators.required, Validators.minLength(3), noWhitespaceValidator()]],
      // file: [null]  // File field added
 
    });
  }
 
  ngOnInit(): void {
    this.loadDocuments();
  }
 
  loadDocuments() {
    this.documentService.getAllDocuments().subscribe((data: any) => {
      this.documents = data as Document[];
      this.filteredDocuments = [...this.documents];
    });
  }
 
  applyFilter() {
    this.filteredDocuments = this.documents.filter(doc =>
      (!this.filters.fileName || doc.fileName.toLowerCase().includes(this.filters.fileName.toLowerCase())) &&
      (!this.filters.author || doc.author.toLowerCase().includes(this.filters.author.toLowerCase())) &&
      (this.filters.dateRange[0] && this.filters.dateRange[1]
        ? new Date(doc.uploadedAt) >= this.filters.dateRange[0]! && new Date(doc.uploadedAt) <= this.filters.dateRange[1]!
        : true)
    );
  }
 
  viewDocument(doc: Document) {
    this.selectedDocument = { ...doc };
    this.dialogTitle = 'View Document';
    this.isEditing = false;
    this.displayDialog = true;
  }
 
  editDocument(doc: Document) {
    this.selectedDocument = { ...doc }; 
    this.dialogTitle = 'Edit Document';
    this.isEditing = true;
    this.displayDialog = true;
  
    this.uploadForm.patchValue({
      author: doc.author,
    });
  
    this.selectedFile = null; 
    this.errorMessage = '';
  }
  
 
  updateDocument() {
    this.documentService.updateDocument(this.selectedDocument).subscribe(() => {
      this.loadDocuments();
      this.displayDialog = false;
    });
  }
 
  deleteDocument(docId: number) {
    if (confirm('Are you sure you want to delete this document?')) {
      this.documentService.deleteDocument(docId).subscribe(() => {
        this.loadDocuments();
      });
    }
  }
 
  showCreateForm() {
    this.dialogTitle = 'Create Document';
    this.isEditing = false;
    this.selectedDocument = {} as Document;
    this.displayDialog = true;
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
        this.uploadForm.patchValue({ fileName: file.name }); // Image name patch

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
  formData.append('authorName', this.uploadForm.value.author); 

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


  viewAllFiles() {
    this.documentService.getAllFilesLog().subscribe((data) => {
      this.allFilesLog = data as any;  
      this.displayLogDialog = true;
    });
    
  }
  
 
  logout() {
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
}
export function noWhitespaceValidator(): ValidatorFn {
  return (control: AbstractControl) => {
    if (control.value && control.value.trim().length === 0) {
      return { whitespace: true };
    }
    return null;
  };
}
 