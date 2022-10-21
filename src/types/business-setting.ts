export class BusinessSetting {
  constructor(public is_autoapprove: boolean) {}
}

export class BusinessSettingObj {
  constructor(
    public setting: BusinessSetting
    ) {}
}
