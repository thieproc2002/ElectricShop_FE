import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Cart } from 'src/app/common/Cart';
import { CartDetail } from 'src/app/common/CartDetail';
import { Category } from 'src/app/common/Category';
import { Customer } from 'src/app/common/Customer';
import { Favorites } from 'src/app/common/Favorites';
import { Product } from 'src/app/common/Product';
import { Rate } from 'src/app/common/Rate';
import { CartService } from 'src/app/services/cart.service';
import { CategoryService } from 'src/app/services/category.service';
import { CustomerService } from 'src/app/services/customer.service';
import { FavoritesService } from 'src/app/services/favorites.service';
import { ProductService } from 'src/app/services/product.service';
import { RateService } from 'src/app/services/rate.service';
import { SessionService } from 'src/app/services/session.service';

@Component({
  selector: 'app-all-product',
  templateUrl: './all-product.component.html',
  styleUrls: ['./all-product.component.css']
})
export class AllProductComponent implements OnInit {

  products!: Product[];
  productsBK!: Product[];
  isLoading = true;
  customer!: Customer;
  favorite!: Favorites;
  favorites!: Favorites[];
  categories!: Category[];

  cart!: Cart;
  cartDetail!: CartDetail;
  cartDetails!: CartDetail[];

  page: number = 1;

  key: string = '';
  keyF: string = '';
  reverse: boolean = true;

  rates!: Rate[];
  countRate!: number;

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private customerService: CustomerService,
    private toastr: ToastrService,
    private favoriteService: FavoritesService,
    private sessionService: SessionService,
    private router: Router,
    private rateService: RateService,
    private categoryService : CategoryService) { }

  ngOnInit(): void {
    this.router.events.subscribe((evt) => {
      if (!(evt instanceof NavigationEnd)) {
        return;
      }
      window.scrollTo(0, 0)
    });
    this.getProducts();
    this.getAllRate();
    this.getCategories();
    
  }

  getAllRate() {
    this.rateService.getAll().subscribe(data => {
      this.rates = data as Rate[];
    })
  }

  getAvgRate(id: number): number {
    let avgRating: number = 0;
    this.countRate = 0;
    for (const item of this.rates) {
      if (item.product.productId === id) {
        avgRating += item.rating;
        this.countRate++;
      }
    }
    return Math.round(avgRating/this.countRate * 10) / 10;
  }

  getProducts(): void {
    this.productService.getAll().subscribe(
      (data: any) => {
        this.isLoading = false;
        this.products = data as Product[];
        this.productsBK = JSON.parse(JSON.stringify(this.products));
      },
      (error) => {
        this.isLoading = false;
        this.toastr.error('Error!', 'System!');
        console.error('Error fetching products:', error);
      }
    );
  }

  getCategories() {
    this.categoryService.getAll().subscribe(data => {
      this.categories = data as Category[];
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
       
      })
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
            this.favoriteService.getByEmail(email).subscribe(data => {
              this.favorites = data as Favorites[];
              this.favoriteService.setLength(this.favorites.length);
            }, error => {
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
          this.favoriteService.getByEmail(email).subscribe(data => {
            this.favorites = data as Favorites[];
            this.favoriteService.setLength(this.favorites.length);
          }, error => {
            this.toastr.error('Data Error!', 'System!');
          })
        }, error => {
          this.toastr.error('Erros!', 'System!');
        })
      }
    })
  }

  sort(keyF: string) {
    if (keyF === 'enteredDate') {
      this.key = 'enteredDate';
      this.reverse = true;
    } else
      if (keyF === 'priceDesc') {
        this.key = '';
        this.products.sort((a, b) => b.price - a.price);
      } else
        if (keyF === 'priceAsc') {
          this.key = '';
          this.products.sort((a, b) => a.price - b.price);
        }
        else {
          this.key = '';
          this.getProducts();
        }
  }
  checkboxes = [
    { value: 'APPLE', checked: true },
    { value: 'SAMSUNG', checked: true },
    { value: 'TOSHIBA', checked: true },
    { value: 'SONY', checked: true },
    { value: 'LG', checked: true },
    { value: 'OPPO', checked: true }
  ];

  // Hàm để kiểm tra hoặc bỏ kiểm tất cả các checkbox
  toggleAll() {
    const allCheckbox = document.getElementById('allCheckbox') as HTMLInputElement;
    const isChecked = allCheckbox.checked;
    console.log(isChecked)
    if(isChecked == true){
      this.checkboxes.forEach(checkbox => {
        checkbox.checked = isChecked;
        this.products =JSON.parse(JSON.stringify(this.productsBK));
      });
    }else{
      this.products = []
      this.checkboxes.forEach(checkbox => {
        checkbox.checked = false;
      });
    }
   
  }

  // Hàm để xử lý khi có sự thay đổi ở các checkbox con
  checkFilter() {
    const allCheckbox = document.getElementById('allCheckbox') as HTMLInputElement;
    const allChecked = this.checkboxes.every(cb => cb.checked);
   // allCheckbox.checked = allChecked;
 
    this.updateFilteredProducts();
  }
  updateFilteredProducts() {
 
   this.page = 1
   console.log(this.productsBK)
    this.products =JSON.parse(JSON.stringify(this.productsBK));
    const selectedValues = this.checkboxes
      .filter(cb => cb.checked)
      .map(cb => cb.value.toLowerCase());
      console.log(this.products)
      this.products = this.products.filter(product =>
        selectedValues.some(value => product.name.toLowerCase().includes(value))
      );
  }
}
