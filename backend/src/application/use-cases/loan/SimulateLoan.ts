import { SimulateLoanDto, SimulateLoanResponseDto } from '../../dtos/loan/loan.dtos';
import { LoanCalculator } from '../../../domain/services/LoanCalculator';

export class SimulateLoan {
  async execute(dto: SimulateLoanDto): Promise<SimulateLoanResponseDto> {
    const calc = LoanCalculator.calculate({
      amount: dto.amount,
      installments: dto.installments,
      annualRate: dto.annualRate,
    });

    return {
      amount: dto.amount,
      installments: calc.installments,
      annualRate: dto.annualRate,
      monthlyPayment: calc.monthlyPayment,
      totalToPay: calc.totalToPay,
      totalInterest: calc.totalInterest,
    };
  }
}
