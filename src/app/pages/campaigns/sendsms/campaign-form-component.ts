import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Campaign } from '../campaign';
import { CampaignService } from '../campaign.service';
import { Text } from '../../message/text/text';
import { TextService } from '../../message/text/text.service';
import { Group } from '../../contact/group/group';
import { GroupService } from '../../contact/group/group.service';
import { AppService } from '../../../app.service';
import 'rxjs/add/operator/toPromise';

@Component({
  selector: 'ngx-sms-campaign-component',
  templateUrl: './campaign-form-component.html',
  styleUrls: ['./campaign-form-component.scss'],
})
export class FormsSmsCampaignComponent implements OnInit {

  constructor(
    private route: ActivatedRoute,
    private text_service: TextService,
    private group_service: GroupService,
    private campaign_service: CampaignService,
    private router: Router,
    public app_service: AppService,
  ) {}

  campaign: Campaign = new Campaign;
  campaign_id: any = null;
  text: Text[] = [];
  selectedT: Text;
  group: Group[] = [];
  selectedGrp: Group;

  isError = false;
  errorText: any = [];

  ngOnInit(): void {
    this.getTextlist();
    this.getGrouplist();

    this.route.params.subscribe(params => {
      this.campaign_id = +params['id'];
      const segments = this.router.url.split('/');
      const last = segments[segments.length - 1];
      if (last === 'new') return null;
      if (this.campaign_id) {
        return this.campaign_service.get_CampaignData(this.campaign_id).then(data => {
          this.campaign = data;
        });
      }
      return null;
    });
  }

  getTextlist() {
    this.text_service.get_TextList().then(data => {
      this.text = data || [];
      if (this.text.length) this.selectedT = this.text[this.text.length - 1];
    });
  }

  getGrouplist() {
    this.group_service.get_GroupList().then(data => {
      this.group = data || [];
    });
  }

  addSendSms(): void {
    this.checkFields('new');
    if (this.errorText.length) { this.errorHandler(true, this.errorText); return; }

    this.campaign_service.add_sendsms({ text_id: this.selectedT.text_id }).then(program_id => {
      this.campaign.program_id = program_id;
      this.campaign.group_id = this.selectedGrp.group_id;
      this.addCampaign();
    });
  }

  addCampaign(): void {
    this.campaign_service.add_Campaign(this.campaign).then(response => {
      this.router.navigate(['../../campaigns'], { relativeTo: this.route });
      this.app_service.success_message = 'SMS campaign created successfully';
      this.startCampaign(response);
      this.clearMsg();
    }).catch(() => {
      this.app_service.errors = 'Error occurred while creating SMS campaign';
      this.clearMsg();
    });
  }

  startCampaign(campaign_id): void {
    this.campaign_service.start_campaign(campaign_id).then(() => {});
  }

  updateCampaign(): void {
    this.campaign_service.add_sendsms({ text_id: this.selectedT.text_id }).then(program_id => {
      this.campaign.program_id = program_id;
      this.campaign_service.update_Campaign(this.campaign).then(() => {
        this.router.navigate(['../../campaigns'], { relativeTo: this.route });
        this.app_service.success_message = 'SMS campaign updated successfully';
        this.clearMsg();
      });
    });
  }

  private checkFields(status = null): any {
    this.errorHandler(false, []);
    if (!this.selectedT || !this.selectedT.text_id) this.errorText.push('Select a text message.');
    if (status === 'new' && (!this.selectedGrp || !this.selectedGrp.group_id)) this.errorText.push('Choose a contact group.');
  }

  private errorHandler(status, message): any {
    this.isError = status;
    this.errorText = message;
    if (status) {
      setTimeout(() => { this.isError = false; this.errorText = []; }, 10000);
    }
  }

  clearMsg() {
    setTimeout(() => {
      this.app_service.errors = '';
      this.app_service.success_message = '';
    }, 5000);
  }
}
