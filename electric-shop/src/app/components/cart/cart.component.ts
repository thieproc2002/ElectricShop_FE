import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { Cart } from 'src/app/common/Cart';
import { CartDetail } from 'src/app/common/CartDetail';
import { CartService } from 'src/app/services/cart.service';
import { SessionService } from 'src/app/services/session.service';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit {

  cart!: Cart;
  cartDetail!: CartDetail;
  cartDetails!: CartDetail[];

  discount!:number;
  amount!:number;
  amountReal!:number;

  constructor(
    private cartService: CartService,
    private toastr: ToastrService,
    private router: Router,
    private sessionService: SessionService) {

   }

  ngOnInit(): void {
    this.router.events.subscribe((evt) => {
      if (!(evt instanceof NavigationEnd)) {
        return;
      }
      window.scrollTo(0, 0)
    });
    this.discount=0;
    this.amount=0;
    this.amountReal=0;
    this.getAllItem();
  }

  getAllItem() {
    let email = this.sessionService.getUser();
    this.cartService.getCart(email).subscribe(data => {
      this.cart = data as Cart;
      this.cartService.getAllDetail(this.cart.cartId).subscribe(data => {
        this.cartDetails = data as CartDetail[];
        this.cartService.setLength(this.cartDetails.length);
        this.cartDetails.forEach(item=>{
          this.amountReal += item.product.price * item.quantity;
          this.amount += item.price;
        })
        this.discount = this.amount - this.amountReal;
      })
    })
  }

  update(id: number, quantity: number) {
    
    if (quantity < 1) {
      this.delete(id);
    } else {
      this.cartService.getOneDetail(id).subscribe(data => {
        this.cartDetail = data as CartDetail;
        if(quantity> this.cartDetail.product.quantity){
          this.toastr.info('Số lượng không đủ, Sản phẩm này chỉ còn ' + this.cartDetail.product.quantity , 'System!');
          const idToFind = this.cartDetail.cartDetailId; // Assuming this.cartDetail has an 'id' property
          const item = this.cartDetails.find(item => item.cartDetailId === idToFind);

          if (item) {
            item.quantity =this.cartDetail.product.quantity;
          }
          return;
        }
        this.cartDetail.quantity = quantity;
        this.cartDetail.price = (this.cartDetail.product.price * (1 - this.cartDetail.product.discount / 100)) * quantity;
       
        this.cartService.updateDetail(this.cartDetail).subscribe(data => {
          this.ngOnInit();
        }, error => {
          this.toastr.error('Error!' + error.status, 'System!');
        })
      }, error => {
        this.toastr.error('Error! ' + error.status, 'System!');
      })
    }
  }

  delete(id: number) {
    Swal.fire({
      title: 'Bỏ sản phẩm ra khỏi giỏ hàng?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      cancelButtonText: 'No',
      confirmButtonText: 'Yes'
    }).then((result) => {
      if (result.isConfirmed) {
        this.cartService.deleteDetail(id).subscribe(data => {
          this.toastr.success('Success!', 'System!');
          this.ngOnInit();
        }, error => {
          this.toastr.error('Failed! ' + error.status, 'System!');
        })
      }
    })
  }

}
