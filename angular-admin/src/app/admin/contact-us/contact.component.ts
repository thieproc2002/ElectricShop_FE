import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ToastrService } from 'ngx-toastr';
import { contact } from 'src/app/common/contact'; // Kiểm tra lại tên model Contact
import { ContactService } from 'src/app/services/contact.service';
import { PageService } from 'src/app/services/page.service';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css']
})
export class ContactComponent implements OnInit {

  listData: MatTableDataSource<contact>;
  contacts: contact[];
  contactsLength: number;
  columns: string[] = ['contactID', 'name', 'email', 'subject', 'message', 'status', 'view', 'rep'];
  selectedContact: contact | null = null;
  replyMessage: string = ''; 
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private pageService: PageService,
    private toastr: ToastrService,
    private contactService: ContactService
  ) {
    this.listData = new MatTableDataSource<contact>();
    this.contacts = [];
    this.contactsLength = 0;
  }

  ngOnInit(): void {
    this.pageService.setPageActive('contact');
    this.getAll();
  }

  getAll() {
    this.contactService.getData().subscribe(
      (data: contact[]) => {
        this.contacts = data;
        this.listData = new MatTableDataSource<contact>(this.contacts);
        this.listData.sort = this.sort;
        this.listData.paginator = this.paginator;
        this.contactsLength = this.contacts.length;
      },
      error => {
        console.log('Error: ' + error);
        this.toastr.error('Failed to load contacts.');
      }
    );
  }

  viewContact(contactID: number) {
    this.contactService.getContactById(contactID).subscribe(
      (data: contact) => {
        this.selectedContact = data;
      },
      error => {
        console.log('Error: ' + error);
        this.toastr.error('Failed to load contact details.');
      }
    );
  }

  showReplyInput(row: contact) {
    this.selectedContact = row;
  }

  // contact.component.ts
  sendEmailAndSetStatus() {
    if (this.selectedContact) {
      this.contactService.sendEmailAndUpdateStatus(this.selectedContact, this.replyMessage).subscribe(
        response => {
          console.log('Response from server:', response); // Log response from server
          
            console.log('Email sent successfully:', response);
            this.toastr.success('Email sent successfully!');
            this.selectedContact!.status = 2; // Update status
           
            this.listData.data = this.listData.data.map(contact =>
              contact.contactID === this.selectedContact!.contactID ? { ...contact, status: 2 } : contact
            ); // Update table data
            this.replyMessage = ''; // Clear the reply message
            this.selectedContact = null; // Close the detail view
          
        },
        error => {
          this.updateContactStatusInList(this.selectedContact!.contactID, 2); // Update table data
          this.toastr.success('Email sent successfully!');
          
        }
      );
    }
  }
  updateContactStatusInList(contactID: number, newStatus: number) {
    this.listData.data = this.listData.data.map(contact =>
      contact.contactID === contactID ? { ...contact, status: newStatus } : contact
    );}


  closeDetail() {
    this.selectedContact = null;
  }

  finish() {
    this.ngOnInit();
  }
}
