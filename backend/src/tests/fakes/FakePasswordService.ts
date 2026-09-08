import { IPasswordService } from '../../application/interfaces/IPasswordService';
export class FakePasswordService implements IPasswordService {
  async hash(plainPassword: string): Promise<string> {
    return `hashed_${plainPassword}`;
  }
  async compare(plainPassword: string, hash: string): Promise<boolean> {
    return hash === `hashed_${plainPassword}`;
  }
}
