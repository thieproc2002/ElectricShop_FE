import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { Customer } from 'src/app/common/Customer';
import { Order } from 'src/app/common/Order';
import { CustomerService } from 'src/app/services/customer.service';
import { OrderService } from 'src/app/services/order.service';
import { PageService } from 'src/app/services/page.service';
import { SessionService } from 'src/app/services/session.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-customer',
  templateUrl: './customer.component.html',
  styleUrls: ['./customer.component.css']
})
export class CustomerComponent implements OnInit {

  listData!: MatTableDataSource<Customer>;
  customers!: Customer[];
  customerLength!: number;
  columns: string[] = ['image', 'userId', 'name', 'email', 'address', 'phone', 'gender', 'registerDate', 'status', 'view', 'delete'];

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  emailAdmin!: string;

  orders!: Order[];
  page: number = 1;
  done!: number;


  selectedCustomer: Customer | null = null; // Đây là thuộc tính để lưu trữ thông tin của khách hàng được chọn

  constructor(private pageService: PageService, private customerService: CustomerService, private toastr: ToastrService, private sessionService: SessionService, private orderService: OrderService, private modalService: NgbModal) { }

  ngOnInit(): void {
    this.emailAdmin = this.sessionService.getUser();
    this.pageService.setPageActive('customer');
    this.getAll();
  }

  getAll() {
    this.customerService.getAll().subscribe(data => {
      this.customers = data as Customer[];
      this.customers = this.customers.filter(c => c.email != this.emailAdmin);
      this.listData = new MatTableDataSource(this.customers);
      this.listData.sort = this.sort;
      this.listData.paginator = this.paginator;
    }, error => {
      console.log(error);
    });
  }

  delete(id: number, name: string) {
    // Kiểm tra trạng thái của người dùng
    this.customerService.getUserStatus(id).subscribe(
      (status: boolean) => {
        // Nếu status = true, hiển thị cửa sổ xác nhận xóa
        if (status) {
          Swal.fire({
            title: 'Do you want to ban the user ' + name + ' for 3 days?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ban',
            cancelButtonText: 'No'
          }).then((result) => {
            // Nếu người dùng xác nhận xóa
            if (result.isConfirmed) {
              // Gọi API delete từ service
              this.customerService.delete(id).subscribe(
                () => {
                  // Nạp lại dữ liệu sau khi xóa thành công
                  this.getAll();
                  this.toastr.success('Ban successfully!', 'System');
                },
                (error) => {
                  // Xử lý lỗi khi xóa không thành công
                  this.toastr.error('Failed to delete, an error occurred!', 'System');
                }
              );
            }
          });
        } else {
          // Nếu status = false, hiển thị cửa sổ xác nhận hủy
          Swal.fire({
            title: 'Do you want to cancel the ban for user ' + name + '?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Cancel Ban',
            cancelButtonText: 'No'
          }).then((result) => {
            // Nếu người dùng xác nhận hủy
            if (result.isConfirmed) {
              // Gọi API cancel từ service
              this.customerService.cancel(id).subscribe(
                () => {
                  // Nạp lại dữ liệu sau khi hủy thành công
                  this.getAll();
                  this.toastr.success('Cancelled successfully!', 'System');
                },
                (error) => {
                  // Xử lý lỗi khi hủy không thành công
                  this.toastr.error('Failed to cancel, an error occurred!', 'System');
                }
              );
            }
          });
        }
      },
      (error) => {
        // Xử lý lỗi khi không thể lấy được trạng thái người dùng
        console.error('Failed to fetch user status', error);
        this.toastr.error('Failed to fetch user status!', 'System');
      }
    );
  }

  getOrder(email: string) {
    this.orderService.getByEmail(email).subscribe(data => {
      this.orders = data as Order[];
      this.done = 0;
      this.orders.forEach(o => {
        if (o.status === 2) {
          this.done += 1;
        }
      });
    }, error => {
      this.toastr.error('Error fetching orders!', 'System');
    });
  }

  ShowOrderHistory(content: TemplateRef<any>, customer: Customer) {
    this.selectedCustomer = customer; // Thiết lập selectedCustomer với khách hàng được chọn
    this.getOrder(customer.email); // Gọi hàm getOrder để lấy thông tin đơn hàng của khách hàng
    this.modalService.open(content, { size: 'l' });
  }

  search(event: any) {
    const fValue = (event.target as HTMLInputElement).value;
    this.listData.filter = fValue.trim().toLowerCase();
  }

  finish() {
    this.ngOnInit();
  }

}
