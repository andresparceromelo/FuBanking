import { SimulateLoanDto, SimulateLoanResponseDto } from '../../dtos/loan/loan.dtos';

export class SimulateLoan {
  async execute(dto: SimulateLoanDto): Promise<SimulateLoanResponseDto> {
    const installments = Math.max(dto.installments, 1);
    const monthlyRate = dto.annualRate / 100 / 12;

    let monthlyPayment = dto.amount / installments;

    if (monthlyRate > 0) {
      monthlyPayment =
        (dto.amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -installments));
    }

    return {
      amount: dto.amount,
      installments,
      annualRate: dto.annualRate,
      monthlyPayment,
      totalToPay: monthlyPayment * installments,
      totalInterest: monthlyPayment * installments - dto.amount,
    };
  }
}
