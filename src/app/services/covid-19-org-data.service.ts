import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
@Injectable({
  providedIn: 'root'
})
export class Covid19OrgDataService {

  constructor(private http: HttpClient) { }

  getStateWiseList(){
    return this.http.get('https://api.covid19india.org/data.json');
  }

  getDistrictList(){
    return this.http.get('https://api.covid19india.org/v2/state_district_wise.json');
  }
}
