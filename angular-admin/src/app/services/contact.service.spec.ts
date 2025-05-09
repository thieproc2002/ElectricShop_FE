import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ContactService } from './contact.service';

describe('ContactSevice', () => {
  let service: ContactService;


  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ContactService]
    });
    service = TestBed.inject(ContactService);

  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

});
