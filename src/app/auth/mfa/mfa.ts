export class Mfa {
    template_id: any;
    template: any;
    phone: number;
    email: any;
    program_id: any;
    account_id: any;
    contact_id: any;
    transmission: any;
    transmissionid: any;
    transmissionsendid: any;
    verificationCode: string = '';
    vcode: string = '';
    expiryTime: number;
    verificationError: string;
    totpSecret: any;
    qrCodeUrl: any;
    totpUser: any;
}
