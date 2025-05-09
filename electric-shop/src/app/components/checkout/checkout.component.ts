import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NavigationEnd, Router } from '@angular/router';
import { ICreateOrderRequest, IPayPalConfig } from 'ngx-paypal';
import { ToastrService } from 'ngx-toastr';
import { Cart } from 'src/app/common/Cart';
import { CartDetail } from 'src/app/common/CartDetail';
import { ChatMessage } from 'src/app/common/ChatMessage';
import { District } from 'src/app/common/District';
import { Notification } from 'src/app/common/Notification';
import { Order } from 'src/app/common/Order';
import { Province } from 'src/app/common/Province';
import { Ward } from 'src/app/common/Ward';
import { CartService } from 'src/app/services/cart.service';
import { NotificationService } from 'src/app/services/notification.service';
import { OrderService } from 'src/app/services/order.service';
import { ProvinceService } from 'src/app/services/province.service';
import { SessionService } from 'src/app/services/session.service';
import { WebSocketService } from 'src/app/services/web-socket.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {

  cart!: Cart;
  cartDetail!: CartDetail;
  cartDetails!: CartDetail[];

  discount!: number;
  amount!: number;
  amountReal!: number;

  postForm: FormGroup;

  provinces!: Province[];
  districts!: District[];
  wards!: Ward[];

  province!: Province;
  district!: District;
  ward!: Ward;

  amountPaypal !:number;
  provinceCode!: number;
  districtCode!: number;
  wardCode!: number;
  public payPalConfig ? : IPayPalConfig;

  constructor(
    private cartService: CartService,
    private toastr: ToastrService,
    private router: Router,
    private sessionService: SessionService,
    private orderService: OrderService,
    private location: ProvinceService,
    private webSocketService: WebSocketService,
    private notificationService: NotificationService) {
    this.postForm = new FormGroup({
      'phone': new FormControl(null, [Validators.required, Validators.pattern('(0)[0-9]{9}')]),
      'province': new FormControl(0, [Validators.required, Validators.min(1)]),
      'district': new FormControl(0, [Validators.required, Validators.min(1)]),
      'ward': new FormControl(0, [Validators.required, Validators.min(1)]),
      'number': new FormControl('', Validators.required),
    })
  }

  ngOnInit(): void {
    this.checkOutPaypal();
    this.webSocketService.openWebSocket();
    this.router.events.subscribe((evt) => {
      if (!(evt instanceof NavigationEnd)) {
        return;
      }
      window.scrollTo(0, 0)
    });
    this.discount = 0;
    this.amount = 0;
    this.amountPaypal = 0;
    this.amountReal = 0;
    this.getAllItem();
    this.getProvinces();
  }

  getAllItem() {
    let email = this.sessionService.getUser();
    this.cartService.getCart(email).subscribe(data => {
      this.cart = data as Cart;
      this.postForm = new FormGroup({
        'phone': new FormControl(this.cart.phone, [Validators.required, Validators.pattern('(0)[0-9]{9}')]),
        'province': new FormControl(0/*, [Validators.required, Validators.min(1)]*/),
        'district': new FormControl(0/*, [Validators.required, Validators.min(1)]*/),
        'ward': new FormControl(0/*, [Validators.required, Validators.min(1)]*/),
        'number': new FormControl('', Validators.required),
      })
      this.cartService.getAllDetail(this.cart.cartId).subscribe(data => {
        this.cartDetails = data as CartDetail[];
        this.cartService.setLength(this.cartDetails.length);
        if (this.cartDetails.length == 0) {
          this.router.navigate(['/']);
          this.toastr.info('Select a few products and proceed to checkout', 'System!');
        }
        this.cartDetails.forEach(item => {
          this.amountReal += item.product.price * item.quantity;
          this.amount += item.price;
        })
        this.discount = this.amount - this.amountReal;

        this.amountPaypal = (this.amount/25989);
      });
    });
  }

  checkOut() {
  if (this.postForm.valid) {
    if (1==1) { // Kiểm tra xem các thuộc tính đã được gán giá trị chưa
      Swal.fire({
        title: 'Do you want to place this order?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        cancelButtonText: 'No',
        confirmButtonText: 'Yes'
      }).then((result) => {
        if (result.isConfirmed) { // Kiểm tra nếu người dùng đã bấm nút "Yes"
          let email = this.sessionService.getUser();
          this.cartService.getCart(email).subscribe(data => {
            this.cart = data as Cart;

            this.cart.address = this.postForm.value.number /*+ ', ' + this.getWardByCode(this.wardCode) + ', ' + this.getDistristByCode(this.districtCode) + ', ' + this.getProvineByCode(this.provinceCode)*/;
            this.cart.phone = this.postForm.value.phone;
            this.cartService.updateCart(email, this.cart).subscribe(data => {
              this.cart = data as Cart;
              this.orderService.post(email, this.cart).subscribe(data => {
                let order: Order = data as Order;
                this.sendMessage(order.ordersId);
                Swal.fire(
                  'Success!',
                  'Congratulations, your order was placed successfully.',
                  'success'
                );
                this.router.navigate(['/cart']);
              }, error => {
                this.toastr.error(`Your cart has Product is out of stock!`);
              });
            }, error => {
              this.toastr.error('Error!', 'System!');
            });
          }, error => {
            this.toastr.error('Error!', 'System!');
          });
        } else {
          // Hành động khi người dùng bấm "Cancel"
          Swal.fire(
            'Cancelled',
            'Your order was not placed.',
            'error'
          );
        }
      });
    } else {
      console.error('One or more of ward, district, or province is undefined.');
    }
  } else {
    this.toastr.error('Please enter all required information', 'System!');
  }
}
checkOutpay() {
  if (this.postForm.valid) {
    if (1==1) { // Kiểm tra xem các thuộc tính đã được gán giá trị chưa
      Swal.fire({
        title: 'Do you want to place this order?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        cancelButtonText: 'No',
        confirmButtonText: 'Yes'
      }).then((result) => {
        if (result.isConfirmed) { // Kiểm tra nếu người dùng đã bấm nút "Yes"
          let email = this.sessionService.getUser();
          this.cartService.getCart(email).subscribe(data => {
            this.cart = data as Cart;

            this.cart.address = this.postForm.value.number;
            this.cart.phone = this.postForm.value.phone;
            this.cartService.updateCart(email, this.cart).subscribe(data => {
              this.cart = data as Cart;
              this.orderService.postpaypal(email, this.cart).subscribe(data => {
                let order: Order = data as Order;
                this.sendMessage(order.ordersId);
                Swal.fire(
                  'Success!',
                  'Congratulations, your order was placed successfully.',
                  'success'
                );
                this.router.navigate(['/cart']);
              }, error => {
                this.toastr.error(`Your cart has Product is out of stock!`);
              });
            }, error => {
              this.toastr.error('Error!', 'System!');
            });
          }, error => {
            this.toastr.error('Error!', 'System!');
          });
        } else {
          // Hành động khi người dùng bấm "Cancel"
          Swal.fire(
            'Cancelled',
            'Your order was not placed.',
            'error'
          );
        }
      });
    } else {
      console.error('One or more of ward, district, or province is undefined.');
    }
  } else {
    this.toastr.error('Please enter all required information', 'System!');
  }
}


  sendMessage(id:number) {
    let chatMessage = new ChatMessage(this.cart.user.name, ' has placed an order.');
    this.notificationService.post(new Notification(0, this.cart.user.name + ' has placed an order. ('+id+')')).subscribe(data => {
      this.webSocketService.sendMessage(chatMessage);
    })
  }

  getProvinces() {
    this.location.getAllProvinces().subscribe(data => {
      const results = data as any;
      const provincesRs = results['results'] as any[];
    
      this.provinces = provincesRs.map(province => ({
        code: province.province_id,
        name: province.province_name
      })) as Province[]
    })
  }

  getDistricts() {
    this.location.getDistricts(this.provinceCode).subscribe(data => {
      
      this.districts = ((data as any)['results'] as any[]).map(district => ({
        code: district.district_id,
        name: district.district_name
      })) as District[]
    })
  }

  getWards() {
    this.location.getWards(this.districtCode).subscribe(data => {
      console.log("ward", data)
      this.wards = ((data as any)['results'] as any[]).map(ward => ({
        code: ward.ward_id,
        name:ward. ward_name
      })) as Ward[]
    })
  }

  getWard() {
    
    if (!this.wardCode) {
      console.error('Ward code is not set.');
      console.log("2")
      return;
    }
  
    this.location.getWard(this.wardCode).subscribe(
      (data: any) => {
        this.ward = data as Ward;
      },
      (error) => {
        console.error('Error fetching ward:', error);
        // Handle the error, e.g., display an error message to the user
      }
    );
    
  }

  getWardByCode(code:any) {

    for (let obj of this.wards) {
        // Nếu mã của đối tượng trùng với mã được truyền vào
        if (obj.code === code) {
            // Trả về đối tượng hiện tại
            return obj.name;
        }
    }
    // Nếu không tìm thấy đối tượng nào có mã trùng khớp, trả về null hoặc một giá trị khác tùy thuộc vào yêu cầu của bạn
    return null;
}
getProvineByCode(code:any) {

  for (let obj of this.provinces) {
      // Nếu mã của đối tượng trùng với mã được truyền vào
      if (obj.code === code) {
          // Trả về đối tượng hiện tại
          return obj.name;
      }
  }
  // Nếu không tìm thấy đối tượng nào có mã trùng khớp, trả về null hoặc một giá trị khác tùy thuộc vào yêu cầu của bạn
  return null;
}
getDistristByCode(code:any) {

  for (let obj of this.districts) {
      // Nếu mã của đối tượng trùng với mã được truyền vào
      if (obj.code === code) {
          // Trả về đối tượng hiện tại
          return obj.name;
      }
  }
  // Nếu không tìm thấy đối tượng nào có mã trùng khớp, trả về null hoặc một giá trị khác tùy thuộc vào yêu cầu của bạn
  return null;
}
  

  setProvinceCode(code: any) {
    this.provinceCode = code.value;
    this.getDistricts();
  }

  setDistrictCode(code: any) {
    this.districtCode = code.value;
    this.getWards();
  }

  setWardCode(code: any) {
    console.log("selected province", code)
    this.wardCode = code.value;
    this.getWard();
  }

  private checkOutPaypal(): void {

    this.payPalConfig = {
        currency: 'USD',
        clientId: 'AUCgt1p-frA-P8xTYfeWqhcZPm_4i4kx0BAKAxcVpY1dHCIXjF44LA21ns2UhFYd6WmHJx2L9U817cPO',
        createOrderOnClient: (data) => < ICreateOrderRequest > {
            intent: 'CAPTURE',
            purchase_units: [{
                amount: {
                    currency_code: 'USD',
                    value:String(this.amountPaypal.toFixed(2)),

                },

            }]
        },
        advanced: {
            commit: 'true'
        },
        style: {
            label: 'paypal',
            layout: 'vertical',
            color: 'blue',
            size: 'small',
            shape: 'rect',
        },
        onApprove: (data, actions) => {
            console.log('onApprove - transaction was approved, but not authorized', data, actions);
            actions.order.get().then((details: any) => {
                console.log('onApprove - you can get full order details inside onApprove: ', details);
            });

        },
        onClientAuthorization: (data) => {
            console.log('onClientAuthorization - you should probably inform your server about completed transaction at this point', data);
            this.checkOutpay();
        },
        onCancel: (data, actions) => {
            console.log('OnCancel', data, actions);

        },
        onError: err => {
            console.log('OnError', err);
        },
        onClick: (data, actions) => {
            console.log('onClick', data, actions);

        },
    };
}

}
