
export class contact {
    'contactID': number;
    'name': string;
    'email': string;
    'subject': string;
    'message': string;
   // 'timestamp': string | number;
    'status':number;
    showReplyInput?: boolean; 
    constructor(id:number) {
        this.contactID = id;
    }
}
