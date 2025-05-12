import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ChatMessage } from 'src/app/common/ChatMessage';
import { Order } from 'src/app/common/Order';
import { OrderService } from 'src/app/services/order.service';
import { PageService } from 'src/app/services/page.service';

@Component({
  selector: 'app-order',
  templateUrl: './order.component.html',
  styleUrls: ['./order.component.css']
})
export class OrderComponent implements OnInit {

  listData!: MatTableDataSource<Order>;
  orders!: Order[];
  orderLength!: number;
  columns: string[] = ['id', 'user', 'address', 'phone', 'amount', 'orderDate', 'status', 'view'];
searchOrderId: string = '';
searchName: string = '';
searchPhone: string = '';

  webSocket!: WebSocket;
  chatMessages: ChatMessage[] = [];

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(private pageService: PageService, private toastr: ToastrService, private orderService: OrderService, private route: ActivatedRoute) { 
    route.params.subscribe(val => {
      this.ngOnInit();
    })
  }

  ngOnInit(): void {
    this.openWebSocket();
    this.pageService.setPageActive('order');
    this.getAllOrder();
    
  }

  ngOnDestroy(): void {
    this.closeWebSocket();
  }

  getAllOrder() {
    this.orderService.get().subscribe(data => {
      this.orders = data as Order[];
      this.listData = new MatTableDataSource(this.orders);
      this.orderLength = this.orders.length;
      this.listData.sort = this.sort;
      this.listData.paginator = this.paginator;
    }, error => {
      this.toastr.error('Error! ' + error.status, 'System!');
    })
  }

  search() {
    this.orderService.get().subscribe(data => {
        this.orders = data as Order[];
        
        // Lọc theo từng trường tìm kiếm
        this.orders = this.orders.filter(order => {
            const matchesOrderId = this.searchOrderId === '' || order.ordersId === Number(this.searchOrderId);
            const matchesName = this.searchName === '' || order.user.name.toLowerCase().includes(this.searchName.toLowerCase());
            const matchesPhone = this.searchPhone === '' || order.phone.includes(this.searchPhone);
            
            // const orderDateString = new Date(order.orderDate).toISOString().slice(0, 10); // Chuyển về yyyy-MM-dd
            // const matchesOrderDate = this.searchOrderDate === '' || orderDateString === this.searchOrderDate;

            return matchesOrderId && matchesName && matchesPhone;
        });

        // Cập nhật bảng
        this.listData = new MatTableDataSource(this.orders);
        this.orderLength = this.orders.length;
        this.listData.sort = this.sort;
        this.listData.paginator = this.paginator;
    });
}

  finish() {
    this.ngOnInit();
  }

  openWebSocket() {
    this.webSocket = new WebSocket('ws://localhost:8080/notification');

    this.webSocket.onopen = (event) => {
      // console.log('Open: ', event);
    };

    this.webSocket.onmessage = (event) => {
      this.getAllOrder();
    };

    this.webSocket.onclose = (event) => {
      // console.log('Close: ', event);
    };
  }

  closeWebSocket() {
    this.webSocket.close();
  }

}
