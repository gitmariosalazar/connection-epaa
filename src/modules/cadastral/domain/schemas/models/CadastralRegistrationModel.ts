export class CadastralRegistrationModel {
  constructor(
    public readonly registrationId: string | null,
    public readonly solicitudId: string,
    public readonly contractId: string | null,
    public readonly cadastralKey: string,
    public readonly meterNumber: string,
    public readonly exactAddress: string,
    public readonly longitude: number,
    public readonly latitude: number,
    public readonly connectionDiameter: string | null,
    public readonly serviceType: string | null,
    public readonly installationDate: string,
    public readonly accountNumber: string,
    public readonly registratorId: string,
    public readonly createdAt?: Date,
  ) {}
}
