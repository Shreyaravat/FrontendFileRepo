import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

 
export interface Document{
  id?: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  author: string;
  uploadedAt: string;
  addedDate: string;  

}
 
@Injectable({
  providedIn: 'root'
})
 
export class DocumentService {
  private apiUrl = 'http://localhost:8080/api/documents';
 
  constructor(private http: HttpClient) {}
 
  getAllDocuments(): Observable<Document[]> {
    return this.http.get<Document[]>(this.apiUrl);
  }
 
  updateDocument(doc: Document): Observable<Document> {
    return this.http.put<Document>(`${this.apiUrl}/${doc.id}`, doc);
  }
  
 
  deleteDocument(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getAllFilesLog() {
    return this.http.get<Document[]>('http://localhost:8080/api/files/all');
  }
  
  getFileLogById(id: number): Observable<Document> {
    return this.http.get<Document>(`http://localhost:8080/api/files/${id}`);
  }
  
  
}
 
 
 