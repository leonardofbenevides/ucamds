import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormsModule, NgModel } from '@angular/forms';
import { formataMascara, mascaraValida, UcamMascara } from './ucam-mascara';

@Component({
  imports: [UcamMascara, FormsModule],
  template: `<input ucamMascara="moeda" [(ngModel)]="valor" #m="ngModel" />
    <input ucamMascara="cpf" [(ngModel)]="cpf" #c="ngModel" />`,
})
class Host {
  valor = signal('');
  cpf = signal('');
}

describe('UcamMascara', () => {
  it('formata pelas regras do contrato', () => {
    expect(formataMascara('moeda', '980,0012123')).toBe('98.000.121,23');
    expect(formataMascara('moeda', '98000')).toBe('980,00');
    expect(formataMascara('moeda', '0')).toBe('0,00');
    expect(formataMascara('cpf', '52998224725')).toBe('529.982.247-25');
    expect(formataMascara('cnpj', '11222333000181')).toBe('11.222.333/0001-81');
    expect(formataMascara('telefone', '2198765432')).toBe('(21) 9876-5432');
    expect(formataMascara('telefone', '21987654321')).toBe('(21) 98765-4321');
    expect(formataMascara('cep', '28013602')).toBe('28013-602');
  });

  it('confere o dígito verificador', () => {
    expect(mascaraValida('cpf', '529.982.247-25')).toBe(true);
    expect(mascaraValida('cpf', '111.111.111-11')).toBe(false);
    expect(mascaraValida('cnpj', '11.222.333/0001-81')).toBe(true);
    expect(mascaraValida('cep', '28013')).toBe(false);
  });

  it('o modelo recebe o texto já formatado, e o validador fala a frase', async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    const [valor, cpf] = (f.nativeElement as HTMLElement).querySelectorAll('input');
    expect(valor.getAttribute('inputmode')).toBe('decimal');

    valor.value = '125000';
    valor.dispatchEvent(new Event('input'));
    expect(valor.value).toBe('1.250,00');
    expect(f.componentInstance.valor()).toBe('1.250,00');

    cpf.value = '123';
    cpf.dispatchEvent(new Event('input'));
    f.detectChanges();
    await f.whenStable();
    const modelo = f.debugElement.queryAll((d) => d.name === 'input')[1].injector.get(NgModel);
    expect(modelo.errors).toEqual({ mascara: 'CPF inválido. Confira os 11 dígitos.' });
  });
});
