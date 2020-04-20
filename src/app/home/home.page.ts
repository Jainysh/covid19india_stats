import { Component, OnInit } from '@angular/core';
import { Covid19OrgDataService } from '../services/covid-19-org-data.service';
import { Storage } from '@ionic/storage';
import { SocialSharing } from '@ionic-native/social-sharing/ngx';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})


export class HomePage implements OnInit {

  allData: stateData[];
  totalCases: stateData;
  stateCases: stateData[];
  offline: boolean = false;
  cachedData: boolean = false;
  refreshBtnText: string = 'Refresh';
  sortStateDataBy: string = "confirmed";
  sortStateDataAscending: boolean = true;

  constructor(public covid19Service: Covid19OrgDataService, private toastController: ToastController,
    private storage: Storage, private socialSharing: SocialSharing) { }

  ngOnInit() {
    this.getData();
  }
  async presentToast(message: string, time: number = 1500) {
    const toast = await this.toastController.create({
      message: message,
      duration: time
    });
    toast.present();
  }

  getData() {
    this.refreshBtnText = 'Refreshing...';
    setTimeout(() => {
      if (this.offline && this.cachedData) {
        this.presentToast('Showing previously saved information. Please connect to internet or wifi')
      }
    }, 8000);
    this.storage.get('statewiseData').then(
      stateData => this.storage.get('districtData').then(
        districtData => {
          this.formatData(stateData, districtData);
          this.cachedData = true;
        }
      )
    )
    this.covid19Service.getStateWiseList().subscribe(
      (data) => {
        this.storage.set('statewiseData', data).then(
          () =>
            this.covid19Service.getDistrictList().subscribe(
              (districtData) => {
                this.offline = false;
                this.presentToast('Information updated')
                this.storage.set('districtData', districtData).then(
                  () => this.formatData(data, districtData)
                )
              },
              error => {
                this.offline = false;
                this.formatData(data)
              }
            ))
      },
      error => {
        this.offline = true;
      }
    )
  }

  showDistrictData(state: string) {
    this.stateCases.forEach(element => {
      if (element.state === state) {
        element.expanded = !element.expanded;
      }
    })
  }

  formatData(rawData, districtData?) {
    this.refreshBtnText = 'Refresh'
    this.allData = rawData.statewise;
    if (this.totalCases) {
      this.totalCases.lastupdatedtime = "";
    }
    this.totalCases = rawData.statewise.find(
      element => element.state === 'Total'
    );
    this.stateCases = rawData.statewise.filter(
      element => element.state !== 'Total' && (element.confirmed != "0")
    );
    this.sortStateDataAscending = true;

    if (districtData) {
      this.stateCases.forEach(element => {
        const stateData = districtData.find(district => district.state === element.state);
        if (stateData) {
          element.districts = stateData.districtData;
          element.sortDistrictDataBy = 'confirmed';
          element.sortDistrictDataAscending = true;
          this.sortDistrictData(element.state, 'confirmed');
        }
      })
    }
    this.sortStateData('confirmed');
  }

  sortNumberData(a, b, sortBy, ascending): number {
    if (+a[sortBy] > +b[sortBy]) {
      return ascending ? -1 : 1;
    } else if (+a[sortBy] < +b[sortBy]) {
      return ascending ? 1 : -1;
    } else {
      return 0;
    }
  }

  sortTextData(a, b, sortBy, ascending): number {
    if (a[sortBy] > b[sortBy]) {
      return ascending ? -1 : 1;
    } else if (a[sortBy] < b[sortBy]) {
      return ascending ? 1 : -1;
    } else {
      return 0;
    }
  }

  sortStateData(sortBy) {
    this.sortStateDataBy = sortBy;
    this.stateCases.sort(
      (a, b) => sortBy === 'state' ? this.sortTextData(a, b, sortBy, this.sortStateDataAscending) : this.sortNumberData(a, b, sortBy, this.sortStateDataAscending)
    )
    this.sortStateDataAscending = !this.sortStateDataAscending;
  }

  sortDistrictData(state, sortBy) {
    const selectedState = this.stateCases.find(element => element.state === state)
    this.stateCases[this.stateCases.indexOf(selectedState)].districts.sort(
      (a, b) => sortBy === 'district' ? this.sortTextData(a, b, sortBy, selectedState.sortDistrictDataAscending)
        : this.sortNumberData(a, b, sortBy, selectedState.sortDistrictDataAscending));
    selectedState.sortDistrictDataBy = sortBy;
    this.stateCases[this.stateCases.indexOf(selectedState)].sortDistrictDataAscending = !this.stateCases[this.stateCases.indexOf(selectedState)].sortDistrictDataAscending;
  }

  openWhatsapp() {
    const message = `Your message here`;
    this.socialSharing.shareViaWhatsApp(message);
  }

}

export interface stateData {
  active: string,
  confirmed: string,
  recovered: string,
  deaths: string,
  deltaconfirmed: string,
  deltarecovered: string,
  deltadeaths: string,
  lastupdatedtime: string,
  state: string,
  statecode: string,
  districts: districtData[],
  expanded: boolean,
  sortDistrictDataBy: string,
  sortDistrictDataAscending: boolean,
}

export interface districtData {
  district: string,
  confirmed: number,
  lastupdatedtime: string,
  delta: {
    confirmed: number
  }
}