import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { Customer } from 'src/app/common/Customer';
import { Login } from 'src/app/common/Login';
import { Register } from 'src/app/common/Register';
import { AuthService } from 'src/app/services/auth.service';
import { CustomerService } from 'src/app/services/customer.service';
import { FavoritesService } from 'src/app/services/favorites.service';
import { SendmailService } from 'src/app/services/sendmail.service';
import { SessionService } from 'src/app/services/session.service';

@Component({
  selector: 'app-sign-form',
  templateUrl: './sign-form.component.html',
  styleUrls: ['./sign-form.component.css']
})
export class SignFormComponent implements OnInit {

  login!: Login;
  register !: Register;
  show: boolean = false;
  loginForm: FormGroup;
  registerForm!: FormGroup;
  isLoggedIn = false;
  isLoginFailed = false;
  roles: string = '';
  otpcode!: any;

  constructor(
    private sendMailService: SendmailService,
    private favoriteService: FavoritesService,
    private sessionService: SessionService,
    private toastr: ToastrService,
    private router: Router,
    private authService: AuthService,
    private userService: CustomerService) {
    this.loginForm = new FormGroup({
      'email': new FormControl(null),
      'password': new FormControl(null)
    });

    this.registerForm = new FormGroup({
      'email': new FormControl(null, [Validators.required, Validators.email]),
      'password': new FormControl(null, [Validators.required, Validators.minLength(8), Validators.pattern('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$')]),
      'confirmPassword': new FormControl(null, [Validators.required]), // Confirm Password field
      'name': new FormControl(null, [Validators.required, Validators.minLength(6)]),
      'status': new FormControl(true),
      'gender': new FormControl(true),
      'image': new FormControl('https://i.pinimg.com/736x/b7/91/44/b79144e03dc4996ce319ff59118caf65.jpg'),
      'address': new FormControl(null, [Validators.required]),
      'phone': new FormControl(null, [Validators.required, Validators.minLength(10), Validators.pattern('(0)[0-9]{9}')]),
      'registerDate': new FormControl(new Date()),
      'role': new FormControl(["USER"]),
      
      'otp': new FormControl(null, [Validators.required, Validators.minLength(6)])
    },{ validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.passwordMatchValidator;
    this.checkLogin();
  }

  sign_up() {
    if (this.registerForm.invalid) {
      this.toastr.error('Hãy nhập đầy đủ thông tin!', 'System!');
      return;
    }
    if (this.registerForm.hasError('passwordMismatch')) {
      this.toastr.error('Mật khẩu không chính xác!', 'System!');
      return;
    }
    this.otpcode = localStorage.getItem("otp");

    if (this.registerForm.value.otp == this.otpcode && this.registerForm.value.otp != null) {
      this.register = this.registerForm.value;
      window.localStorage.removeItem("otp");

      this.authService.register(this.register).subscribe(data => {
        Swal.fire({
          icon: 'success',
          title: 'Đăng ký thành công!',
          showConfirmButton: false,
          timer: 1500
        })
        setTimeout(() => {
          window.location.href = ('/');
        },
          500);
      }, error => {
        this.toastr.error(error.message, 'System!');
      });
    }
    else {
      this.toastr.error('OTP không chính xác!', 'System!');
    }

  }
  passwordMatchValidator: ValidatorFn = (control: AbstractControl): { [key: string]: any } | null => {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  };
  sign_in() {
    this.login = this.loginForm.value;

    this.authService.login(this.login).subscribe(
      data => {

        this.sessionService.saveToken(data.token);
        this.isLoginFailed = false;
        this.isLoggedIn = true;

        let userTemp: Customer;
        this.userService.getByEmail(String(this.sessionService.getUser())).subscribe(data => {
          userTemp = data as Customer;
          if (userTemp.roles[0].name == 'ROLE_ADMIN') {

            Swal.fire({
              icon: 'error',
              title: 'Sai thông tin đăng nhập!',
              showConfirmButton: false,
              timer: 1500
            })
            this.toastr.error('Sai thông tin đăng nhập', 'System!');

            this.isLoginFailed = true;
            this.sessionService.signOut();
            return;
          } else {
            Swal.fire({
              icon: 'success',
              title: 'Đăng nhập thành công!',
              showConfirmButton: false,
              timer: 1500
            })

            this.router.navigate(['/home']);

            setTimeout(() => {
              window.location.href = ('/');
            },
              500);
          }
        })
      },
      error => {
        this.toastr.error('Invalid Login Information', 'System!');
        Swal.fire({
          icon: 'error',
          title: 'Login Failed!',
          showConfirmButton: false,
          timer: 1500
        })
        this.isLoginFailed = true;
      }
    );
  }

  sendOtp() {

    this.sendMailService.sendMailOtp(this.registerForm.value.email).subscribe(data => {
      window.localStorage.removeItem("otp");
      window.localStorage.setItem("otp", JSON.stringify(data));

      this.toastr.success('OTP đã được gửi đến email của bạn !', 'System!');
    }, error => {
      if (error.status == 404) {
        this.toastr.error('Email này đã được đăng ký !', 'System!');
      } else {
        this.toastr.warning('Hãy nhập email !', 'System!');
      }
    });

  }

  checkLogin() {
    if (this.sessionService.getUser() != null) {
      this.router.navigate(['/home']);
      window.location.href = ('/');
    }
  }

  toggle() {
    this.show = !this.show;
  }
  sendError() {
    this.toastr.warning('Hãy nhập đúng email', 'System!');
  }

}
