import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { Cart } from 'src/app/common/Cart';
import { CartDetail } from 'src/app/common/CartDetail';
import { Category } from 'src/app/common/Category';
import { Favorites } from 'src/app/common/Favorites';
import { CartService } from 'src/app/services/cart.service';
import { CategoryService } from 'src/app/services/category.service';
import { CustomerService } from 'src/app/services/customer.service';
import { FavoritesService } from 'src/app/services/favorites.service';
import { SessionService } from 'src/app/services/session.service';
import { SearchService } from 'src/app/services/search.service';
@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {

  isLogin: boolean = false;
  categories!: Category[];
  favorites!: Favorites[];
  cartDetails!: CartDetail[];
  cart!: Cart;
  userId: number = 0;

  totalFavoriteItem!: number;
  totalCartItem!: number;
  keyword: string = ' ';

  constructor(
    private categoryService: CategoryService,
    private cartService: CartService,
    private toastr: ToastrService,
    private sessionService: SessionService,
    private customerService: CustomerService,
    private searchService: SearchService,
    private router: Router,
    private favoriteService: FavoritesService) { }

  ngOnInit(): void {
    this.favoriteService.$data.subscribe(data => {
      this.totalFavoriteItem = data;
    })
    this.cartService.$data.subscribe(data => {
      this.totalCartItem = data;
    })
    this.getAllFavorites();
    this.getAllCartItem();
    this.getCategories();
    
    this.checkLogin();
  }

  search(event: any) {
    this.keyword = (event.target as HTMLInputElement).value;
  }
onSearch() {
    if (!this.keyword) return;

    const userId = this.isLogin ? this.userId : 0;
    this.searchService.searchProducts(userId, this.keyword).subscribe(
      data => {
        console.log('Search results:', data);
        this.router.navigate(['/search/' + this.keyword]);
      },
      error => {
        this.toastr.error('Search failed!', 'Error');
      }
    );
  }
  getAllFavorites() {
    let email = this.sessionService.getUser();
    if (email == null) {
      return;
    }
    this.favoriteService.getByEmail(email).subscribe(data => {
      this.favorites = data as Favorites[];
      this.favoriteService.setLength(this.favorites.length);
    }, error => {
      this.toastr.error('Data Error!', 'System!');
    })
  }

  getAllCartItem() {
    let email = this.sessionService.getUser();
    if (email == null) {
      return;
    }
    this.cartService.getCart(email).subscribe(data => {
      this.cart = data as Cart;
      this.cartService.getAllDetail(this.cart.cartId).subscribe(data => {
        this.cartDetails = data as CartDetail[];
        this.cartService.setLength(this.cartDetails.length);
      }, error => {
        this.toastr.error('Data Error!', 'System!');
      })
    }, error => {
      this.toastr.error('Data Error!', 'System!');
    })
  }

  checkLogin() {
    let email = this.sessionService.getUser();
    this.customerService.getByEmail(email).subscribe((data: any) => {
      this.isLogin = true;
      this.userId = data.userId;
    }, error => {
      this.sessionService.signOut();
      this.router.navigate(['home']);
    })
  }

  getCategories() {
    this.categoryService.getAll().subscribe(data => {
      this.categories = data as Category[];
    })
  }

  logout() {
    this.sessionService.signOut();
    window.location.href = ('/');
  }

}
