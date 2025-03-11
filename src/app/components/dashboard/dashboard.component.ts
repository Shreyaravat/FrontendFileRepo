
import { AfterViewInit, Component, HostListener, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { Calendar, CalendarModule } from 'primeng/calendar';
import { ConfirmationService, MessageService } from 'primeng/api';
import { HttpClient } from '@angular/common/http';
import { DocumentService } from '../../services/document.service';
import {  DatePickerModule } from 'primeng/datepicker';
import { ScrollerModule } from 'primeng/scroller';
 
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
    DatePickerModule,
    ScrollerModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  providers: [MessageService, ConfirmationService],
   encapsulation: ViewEncapsulation.None
})
export class DashboardComponent implements OnInit , AfterViewInit {
  @ViewChild(Calendar) calendarComponent!: Calendar;

  ngAfterViewInit() {
    if (this.calendarComponent) {
     // console.log('Calendar Component Loaded:', this.calendarComponent);
    }
  }

  documents: Document[] = [];
  totalRecords = 0;
  loading = false;
  currentPage = 0;
  rowsPerPage = 10;
  bufferSize = 10;

  filteredDocuments: Document[] = [];
  filters = { fileName: '', author: '', dateRange: [] as [Date?, Date?] };
 
  displayDialog: boolean = false;
  isEditing: boolean = false;
  selectedDocument: Document = {} as Document;
  dialogTitle: string = '';
 
  uploadForm: FormGroup;
  selectedFile: File | null = null;
  errorMessage: string = '';
  allFilesLog: Document[] = [];
  displayLogDialog: boolean = false;

  imageUrl: string | null = null;
displayImageDialog: boolean = false;
zoomLevel: number = 1;
rotationAngle: number = 0;

  fileName: string = ''; //  Declare the property

  
  
  
 
  constructor(private documentService: DocumentService, private fb: FormBuilder, private http: HttpClient) {
    this.uploadForm = this.fb.group({
      author: [null, [Validators.required, Validators.minLength(3), noWhitespaceValidator()]],
    });
  }
 
  ngOnInit(): void {
    this.loadDocuments(this.currentPage);
    this.filteredDocuments = [...this.documents]; 
  }
 
  loadDocuments(page: number) {
    if (this.loading) return;
    this.loading = true;
  
    this.documentService.getAllDocuments(page, this.rowsPerPage).subscribe({
      next: (data: any) => {
        console.log('API Response:', data);
  
        if (data && data.doc && Array.isArray(data.doc)) {
          this.documents = [...this.documents, ...data.doc]; 
          this.filteredDocuments = [...this.documents];
          this.totalRecords = data.totalRecords;
        } else {
          console.error('Invalid API response: Expected an object with students array', data);
          this.documents = [];
          this.filteredDocuments = [];
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching documents:', error);
        this.documents = [];
        this.filteredDocuments = [];
        this.loading = false;
      }
    });
  }
  
 
 
  @HostListener('window:scroll', [])
  onScroll() {
   
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
      this.loadMoreData();
    }
  }

  loadMoreData() {
    
    if (this.documents.length < this.totalRecords && !this.loading) {
      this.currentPage++; 
      this.loadDocuments(this.currentPage); 
    }
  }


  applyFilter() {
    console.log('Applying Filter:', this.filters);
  
    this.filteredDocuments = this.documents.filter(doc => {
      const matchesAuthor = !this.filters.author || doc.author.toLowerCase().includes(this.filters.author.toLowerCase());
  
      let matchesDateRange = true;
      if (this.filters.dateRange?.[0] && this.filters.dateRange?.[1]) {
        const uploadedDate = new Date(doc.uploadedAt);
        const startDate = new Date(this.filters.dateRange[0] as Date);
        const endDate = new Date(this.filters.dateRange[1] as Date);
  
        endDate.setHours(23, 59, 59, 999);
  
        matchesDateRange = uploadedDate >= startDate && uploadedDate <= endDate;
      }
  
      return matchesAuthor && matchesDateRange;
    });
  
    console.log('Filtered Documents:', this.filteredDocuments);
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
      this.loadDocuments(this.currentPage);
      this.displayDialog = false;
    });
  }
 
  deleteDocument(docId: number) {
    if (confirm('Are you sure you want to delete this document?')) {
      this.documentService.deleteDocument(docId).subscribe(() => {
        
        this.documents = this.documents.filter(doc => doc.id !== docId);
        this.filteredDocuments = [...this.documents]; 
        
        this.totalRecords--;
  
        if (this.documents.length === 0 && this.currentPage > 0) {
          this.currentPage--;
        }
  
        this.loadDocuments(this.currentPage);
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
        this.uploadForm.patchValue({ fileName: file.name });
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

  // decryptAndPreviewFile(fileName: string) {
  //   if (!fileName) {
  //     console.error("File name is missing!");
  //     return;
  //   }
    
  //   console.log("Decrypting file:", fileName); 
    
  //   this.http.get(`http://localhost:8080/api/documents/decrypt/${fileName}`, { responseType: 'blob' })
  //     .subscribe(
  //       (response) => {
  //         const blob = new Blob([response], { type: 'image/png' });
  //         const url = window.URL.createObjectURL(blob);
  //         window.open(url); 
  //       },

  //       (error) => {
  //         console.error('Error decrypting file:', error);
  //       }
  //     );
  // }

  decryptAndPreviewFile(fileName: string) {
    if (!fileName) {
        console.error("File name is missing!");
        return;
    }

    console.log("Decrypting file:", fileName);

    this.http.get(`http://localhost:8080/api/documents/decrypt/${fileName}`, { responseType: 'blob' })
        .subscribe(
            (response) => {
                const blob = new Blob([response], { type: 'image/png' });
                const url = window.URL.createObjectURL(blob);
                this.imageUrl = url;
                this.displayImageDialog = true; // Open dialog
            },
            (error) => {
                console.error('Error decrypting file:', error);
            }
        );
}

zoomIn() {
  this.zoomLevel += 0.1;
}

zoomOut() {
  if (this.zoomLevel > 0.5) {
      this.zoomLevel -= 0.1;
  }
}

rotateRight() {
  this.rotationAngle += 90;
}

rotateLeft() {
  this.rotationAngle -= 90;
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
