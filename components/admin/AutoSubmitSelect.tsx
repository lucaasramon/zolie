'use client';

/** `<select>` que envia o `<form>` em volta ao mudar — filtros GET sem botão "Filtrar". */
export function AutoSubmitSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} onChange={e => e.currentTarget.form?.requestSubmit()} />;
}
