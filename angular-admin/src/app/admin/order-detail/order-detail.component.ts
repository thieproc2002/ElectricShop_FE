import { Component, EventEmitter, Input, OnInit, Output, TemplateRef } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { Order } from 'src/app/common/Order';
import { OrderDetail } from 'src/app/common/OrderDetail';
import { OrderService } from 'src/app/services/order.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-order-detail',
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.css']
})
export class OrderDetailComponent implements OnInit {

  orderDetails!: OrderDetail[];
  order!: Order;
  listData!: MatTableDataSource<OrderDetail>;
  orderDetailLength!: number;

  columns: string[] = ['index', 'image', 'product', 'quantity', 'price'];

  @Output()
  updateFinish: EventEmitter<any> = new EventEmitter<any>();
  @Input() orderId!: number;

  constructor(private modalService: NgbModal, private orderService: OrderService, private toastr: ToastrService) { }

  ngOnInit(): void {
    this.getOrder();
    this.getDetail();
  }

  getOrder() {
    this.orderService.getById(this.orderId).subscribe(data => {
      this.order = data as Order;
    }, error => {
      this.toastr.error('Error! ' + error.status, 'System!');
    })
  }

  getDetail() {
    this.orderService.getByOrder(this.orderId).subscribe(data => {
      this.orderDetails = data as OrderDetail[];
      this.listData = new MatTableDataSource(this.orderDetails);
      this.orderDetailLength = this.orderDetails.length;
    }, error => {
      this.toastr.error('Error! ' + error.status, 'System!');
    })
  }

  open(content: TemplateRef<any>) {
    this.modalService.open(content, { centered: true, size: 'lg' });
  }

  deliver() {
    Swal.fire({
      title: 'Confirm order ?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No'
    }).then((result) => {
      if (result.isConfirmed) {
        this.orderService.deliver(this.orderId).subscribe(data => {
          this.toastr.success('Confirm!', 'System!');
          this.updateFinish.emit('done');
          this.modalService.dismissAll();
        }, error => {
          this.toastr.error('Error! ' + error.status, 'System!');
        })
      }
    })
  }

  cancel() {
    Swal.fire({
      title: 'Cancel order ?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No'
    }).then((result) => {
      if (result.isConfirmed) {
        this.orderService.cancel(this.orderId).subscribe(data => {
          this.toastr.success('Cancelled!', 'System!');
          this.updateFinish.emit('done');
          this.modalService.dismissAll();
        }, error => {
          this.toastr.error('Error! ' + error.status, 'System!');
        })
      }
    })
  }

  confirm() {
    Swal.fire({
      title: 'Delivered Order?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No'
    }).then((result) => {
      if (result.isConfirmed) {
        this.orderService.success(this.orderId).subscribe(data => {
          this.toastr.success('Payment Received!', 'System!');
          this.updateFinish.emit('done');
          this.modalService.dismissAll();
        }, error => {
          this.toastr.error('Error! ' + error.status, 'System!');
        })
      }
    })
  }

}
