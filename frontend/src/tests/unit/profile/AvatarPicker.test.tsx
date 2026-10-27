import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AvatarPicker } from '@/features/profile/components/AvatarPicker';

describe('AvatarPicker', () => {
  it('should call onChange with the preset on select', () => {
    // Arrange
    let picked = '';
    render(<AvatarPicker value="" onChange={(v) => { picked = v; }} userName="Ana" />);
    // Act
    fireEvent.click(screen.getAllByRole('radio')[0]!);
    // Assert
    expect(picked).not.toBe('');
  });

  it('should forward a custom URL and show the error', () => {
    // Arrange
    let picked = '';
    render(
      <AvatarPicker value="https://x.co/yo.png" onChange={(v) => { picked = v; }} error="URL inválida" userName="Ana" />,
    );
    const input = screen.getByPlaceholderText('...o pega la URL de tu imagen');
    // Act
    fireEvent.change(input, { target: { value: 'https://x.co/otra.png' } });
    // Assert
    expect(picked).toBe('https://x.co/otra.png');
    expect(screen.getByText('URL inválida')).toBeInTheDocument();
  });
});
