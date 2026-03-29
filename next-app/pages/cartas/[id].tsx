import { GetServerSideProps } from 'next'
import React from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../firebase'

type Props = {
  id: string,
  data: any | null
}

export default function Carta({ id, data }: Props) {
  return (
    <main style={{ padding: 24 }}>
      <h1>Carta {id}</h1>
      {data ? (
        <pre>{JSON.stringify(data, null, 2)}</pre>
      ) : (
        <p>Dados não encontrados. Migre a coleção `contemplated_letters` para o Firestore e ajuste regras.</p>
      )}
    </main>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const id = context.params?.id as string;
  try {
    const docRef = doc(db, 'contemplated_letters', id as string);
    const snap = await getDoc(docRef);
    const data = snap.exists() ? snap.data() : null;
    return { props: { id, data } };
  } catch (err) {
    return { props: { id, data: null } };
  }
}
