import { Component, OnInit, TemplateRef } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent implements OnInit {

  postForm: FormGroup;

  constructor(
    private modalService: NgbModal,
    private toastr: ToastrService,
    private userService: AuthService) {
    this.postForm = new FormGroup({
      'email': new FormControl(null, [Validators.required, Validators.email])
    })
  }

  ngOnInit(): void {
  }

  open(content: TemplateRef<any>) {
    this.modalService.open(content, { centered: true });
  }

  submit() {
    if (this.postForm.valid) {
      this.userService.forgotPassword(this.postForm.value.email).subscribe(data => {
        this.toastr.success('A new link has been sent to your email, please check!', 'System!');
        this.modalService.dismissAll();
        this.postForm = new FormGroup({
          'email': new FormControl(null, [Validators.required, Validators.email])
        })
      }, error => {
        if (error.status == 404) {
          this.toastr.error('This email is not registered!', 'System!');
        } else {
          this.toastr.error('Error!', 'System!');
        }
      })
    }

  }

}
