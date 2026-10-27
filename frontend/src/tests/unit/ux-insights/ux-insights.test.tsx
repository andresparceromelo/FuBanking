import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { UxMetricsDashboard } from '@/features/ux-insights/components/UxMetricsDashboard';
import { UxActionBoard } from '@/features/ux-insights/components/UxActionBoard';
import UxReportPage from '@/app/(dashboard)/ux-report/page';

describe('Módulo UX Insights (Resultados de Encuestas y Pizarrón Compartido)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('UxMetricsDashboard', () => {
    it('debe renderizar la portada institucional con los metadatos APA del Plan de Pruebas', () => {
      // Arrange & Act
      render(<UxMetricsDashboard />);

      // Assert
      expect(screen.getByText(/PLAN DE PRUEBAS/i)).toBeInTheDocument();
      expect(screen.getByText(/Diagnóstico de Usabilidad y Experiencia de Usuario \(FUBANK\)/i)).toBeInTheDocument();
      expect(screen.getByText(/03\/08\/2026/i)).toBeInTheDocument();
      expect(screen.getByText('Andres Bedoya')).toBeInTheDocument();
      expect(screen.getByText('Dubin Andres Soto')).toBeInTheDocument();
      expect(screen.getByText('Tomas Henao')).toBeInTheDocument();
      expect(screen.getByText('Stiven Alejandro Bustamante')).toBeInTheDocument();
    });

    it('debe mostrar las tarjetas KPI críticas con la muestra N = 20 y alertas', () => {
      // Arrange & Act
      render(<UxMetricsDashboard />);

      // Assert
      expect(screen.getByText('N = 20')).toBeInTheDocument();
      expect(screen.getByText('4.19 / 5.0')).toBeInTheDocument();
      expect(screen.getByText('1.84 / 5.0')).toBeInTheDocument();
      expect(screen.getByText('100% NO')).toBeInTheDocument();
    });

    it('debe permitir cambiar de pestaña para inspeccionar las diferentes encuestas (QUIM, SAM, SUMI, UES, GRIHO)', () => {
      // Arrange
      render(<UxMetricsDashboard />);

      // Act
      const samButton = screen.getByRole('button', { name: /^SAM$/i });
      fireEvent.click(samButton);

      // Assert
      expect(screen.getByText(/Dominancia \(Control\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Arousal \(Activación Emocional\)/i)).toBeInTheDocument();
    });
  });

  describe('UxActionBoard', () => {
    it('debe renderizar los 6 cajones grandes de tareas con sus respectivos checklists', () => {
      // Arrange & Act
      render(<UxActionBoard />);

      // Assert
      expect(screen.getByText(/Bloque A: Prevención de Errores/i)).toBeInTheDocument();
      expect(screen.getByText(/Bloque B: Centro de Ayuda/i)).toBeInTheDocument();
      expect(screen.getByText(/Bloque C: Accesibilidad Universal WCAG/i)).toBeInTheDocument();
      expect(screen.getByText(/Bloque D: Optimización Responsiva/i)).toBeInTheDocument();
      expect(screen.getByText(/Bloque E: Personalización/i)).toBeInTheDocument();
      expect(screen.getByText(/Bloque F: Diseño Emocional/i)).toBeInTheDocument();
    });

    it('debe permitir marcar y desmarcar una tarea del checklist actualizando el estado', () => {
      // Arrange
      render(<UxActionBoard />);
      const taskTitle = screen.getByText(/Modal de Confirmación con Resumen de Saldo Proyectado/i);

      // Act: Click para completar la tarea
      fireEvent.click(taskTitle);

      // Assert: Tarea tiene clase line-through
      expect(taskTitle).toHaveClass('line-through');

      // Act: Click para desmarcar la tarea
      fireEvent.click(taskTitle);

      // Assert: Tarea ya no tiene clase line-through
      expect(taskTitle).not.toHaveClass('line-through');
    });

    it('debe permitir filtrar tareas por búsqueda textual', () => {
      // Arrange
      render(<UxActionBoard />);
      const searchInput = screen.getByPlaceholderText(/Buscar tarea o heurística/i);

      // Act
      fireEvent.change(searchInput, { target: { value: 'Modo Oscuro' } });

      // Assert
      expect(screen.getByText(/Modo Oscuro \/ Claro Persistente/i)).toBeInTheDocument();
      expect(screen.queryByText(/Tooltips Explicativos de Términos Financieros/i)).not.toBeInTheDocument();
    });
  });

  describe('UxReportPage', () => {
    it('debe renderizar la página completa integrando dashboard y pizarrón', () => {
      // Arrange & Act
      render(<UxReportPage />);

      // Assert
      expect(screen.getByLabelText(/Dashboard de Métricas UX/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Pizarrón Compartido de Tareas UI\/UX/i)).toBeInTheDocument();
    });
  });
});
