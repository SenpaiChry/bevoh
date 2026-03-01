export class AuthModel {
  constructor(
    public EmailOrUsername: string,
    public Password: string,
    public Username: string,
    public Name: string,
    public Surname: string,
    public ConfirmPassword: string,
  ) { }
}

export class UserModel {
  constructor(
    public Id: number,
    public Username: string,
    public Email: string,
    public Name: string,
    public Surname: string,
    public BirthDate?: string | null,
    public Weight?: number | null,
    public Height?: number | null,
    public Bio?: string | null,
    public Sex?: "MALE" | "FEMALE" | null,
    public ImageUrl?: string | null,
  ) { }
}

export class UserEditModel {
  constructor(
    public Id: number,
    // public Username: string,
    public Name: string,
    public Surname: string,
    public BirthDate?: string | null,
    public Weight?: string | null,
    public Height?: string | null,
    public Bio?: string | null,
    public Sex?: "MALE" | "FEMALE" | null,
    public ImageUrl?: string | null,
  ) { }
}