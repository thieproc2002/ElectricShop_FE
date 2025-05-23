import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Cart } from 'src/app/common/Cart';
import { CartDetail } from 'src/app/common/CartDetail';
import { Customer } from 'src/app/common/Customer';
import { Favorites } from 'src/app/common/Favorites';
import { Product } from 'src/app/common/Product';
import { Rate } from 'src/app/common/Rate';
import { CartService } from 'src/app/services/cart.service';
import { CustomerService } from 'src/app/services/customer.service';
import { FavoritesService } from 'src/app/services/favorites.service';
import { ProductService } from 'src/app/services/product.service';
import { RateService } from 'src/app/services/rate.service';
import { SessionService } from 'src/app/services/session.service';
import { RecommendService } from 'src/app/services/recommend.service';
// import { NavigationEnd, Router } from '@angular/router';
@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.css']
})
export class HomepageComponent implements OnInit {

  productSeller!:Product[];
  productLatest!:Product[];
  productRated!:Product[];
  productRecommend!:Product[];
  isLoading = true;

  customer!: Customer;
  favorite!: Favorites;
  favorites!: Favorites[];

  cart!: Cart;
  cartDetail!: CartDetail;
  cartDetails!: CartDetail[];
  userId: number = 0;
  rates!: Rate[];
  countRate!: number;

  slideConfig = {"slidesToShow": 7, "slidesToScroll": 2, "autoplay": true};

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private customerService: CustomerService,
    private rateService: RateService,
    private toastr: ToastrService,
    private favoriteService: FavoritesService,
    private recommendService: RecommendService,
    private sessionService: SessionService,
    private router: Router) { }

  ngOnInit(): void {
    this.router.events.subscribe((evt) => {
      if (!(evt instanceof NavigationEnd)) {
        return;
      }
      window.scrollTo(0, 0)
    });
    this.getAllProductBestSeller();
    this.getAllProductLatest();
    this.getAllProductRated();
    this.getAllRate();
    this.getAllProductRecommend()
  }

  getAllRate() {
    this.rateService.getAll().subscribe(data => {
      this.rates = data as Rate[];
    })
  }

  getAvgRate(id: number): number {
    let avgRating: number = 0;
    this.countRate = 0;
    
    // Kiểm tra nếu this.rates không tồn tại hoặc không có dữ liệu
    if (!this.rates || this.rates.length === 0) {
      return 0; // Trả về giá trị mặc định nếu không có dữ liệu
    }
  
    for (const item of this.rates) {
      if (item.product.productId === id) {
        avgRating += item.rating;
        this.countRate++;
      }
    }
  
    // Kiểm tra nếu không có đánh giá nào cho sản phẩm này
    if (this.countRate === 0) {
      return 0; // Trả về giá trị mặc định nếu không có đánh giá
    }
  
    return Math.round(avgRating / this.countRate * 10) / 10;
  }
  

  getAllProductBestSeller() {
    this.productService.getBestSeller().subscribe(data=>{
      this.productSeller = data as Product[];
      this.isLoading = false;
    }, error=>{
      this.toastr.error('Lỗi server!', 'Hệ thống')   
      console.log(error);   
    })
  }
getAllProductRecommend() {
  const email = this.sessionService.getUser();

  // Kiểm tra nếu chưa đăng nhập
  if (!email) {
    this.productRecommend = this.productSeller;
    this.isLoading = false;
    return;
  }

  // Lấy userId từ email
  this.customerService.getByEmail(email).subscribe(
    (data: any) => {
      this.userId = data.userId;
      
      // Chỉ gọi recommend sau khi đã lấy được userId
      this.recommendService.getRecommend(this.userId).subscribe(
        (data) => {
          this.productRecommend = data as Product[];
          this.isLoading = false;
        },
        (error) => {
          this.toastr.error('Lỗi server!', 'Hệ thống');
          console.error(error);
          this.isLoading = false;
        }
      );
    },
    (error) => {
      this.toastr.error('Lỗi server!', 'Hệ thống');
      console.error(error);
    }
  );
}


  getAllProductLatest() {
    this.productService.getLasted().subscribe(data=>{
      this.productLatest = data as Product[];
      this.isLoading = false;
    }, error=>{
      this.toastr.error('Lỗi server!', 'Hệ thống')  
      console.log(error);    
    })
  }

  getAllProductRated() {
    this.productService.getRated().subscribe(data=>{
      this.productRated = data as Product[];
      this.isLoading = false;
    }, error=>{
      this.toastr.error('Error!', 'System!')   
      console.log(error);
         
    })
  }

  toggleLike(id: number) {
    let email = this.sessionService.getUser();
    if (email == null) {
      this.router.navigate(['/sign-form']);
      this.toastr.info('Please Login To Continue', 'System!');
      return;
    }
    this.favoriteService.getByProductIdAndEmail(id, email).subscribe(data => {      
      if (data == null) {
        this.customerService.getByEmail(email).subscribe(data => {
          this.customer = data as Customer;
          this.favoriteService.post(new Favorites(0, new Customer(this.customer.userId), new Product(id))).subscribe(data => {
            this.toastr.success('Add Success!', 'System!');
            this.favoriteService.getByEmail(email).subscribe(data=>{
              this.favorites = data as Favorites[];
              this.favoriteService.setLength(this.favorites.length);
            }, error=>{
              this.toastr.error('Data Error!', 'System!');
            })
          }, error => {
            this.toastr.error('Add Error!', 'System!');
          })
        })
      } else {
        this.favorite = data as Favorites;
        this.favoriteService.delete(this.favorite.favoriteId).subscribe(data => {
          this.toastr.info('Remove From Favorite List!', 'System!');
          this.favoriteService.getByEmail(email).subscribe(data=>{
            this.favorites = data as Favorites[];
            this.favoriteService.setLength(this.favorites.length);
          }, error=>{
            this.toastr.error('Data Error!', 'System!');
          })
        }, error => {
          this.toastr.error('Error!', 'System!');
        })
      }
    })
  }

  addCart(productId: number, price: number) {
    let email = this.sessionService.getUser();
    if (email == null) {
      this.router.navigate(['/sign-form']);
      this.toastr.info('Please Login To Continue', 'System!');
      return;
    }
    this.cartService.getCart(email).subscribe(data => {
      this.cart = data as Cart;
      this.cartDetail = new CartDetail(0, 1, price, new Product(productId), new Cart(this.cart.cartId));
      this.cartService.postDetail(this.cartDetail).subscribe(data => {
        this.toastr.success('Add To Cart Success!', 'System!');
        this.cartService.getAllDetail(this.cart.cartId).subscribe(data => {
          this.cartDetails = data as CartDetail[];
          this.cartService.setLength(this.cartDetails.length);
        })
      }, error => {
        this.toastr.error('This Products Maybe Out Of Stock!', 'System!');
        this.router.navigate(['/home']);
        window.location.href = "/";
      })
    })
  }

}
