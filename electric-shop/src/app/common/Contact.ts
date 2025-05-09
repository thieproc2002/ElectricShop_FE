
export class contact {
    'contactID': number;
    'name': string;
    'email': string;
    'subject': string;
    'message': string;
   // 'timestamp': string | number;
    'status':number
    constructor(id:number) {
        this.contactID = id;
    }
}
