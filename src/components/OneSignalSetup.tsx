'use client';

import { useEffect } from 'react';
import OneSignal from 'react-onesignal';

export default function OneSignalSetup() {
  useEffect(() => {
    // Só roda no navegador
    if (typeof window !== 'undefined') {
      try {
        OneSignal.init({
          appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!, // O '!' força o typescript aceitar, // <--- COLAR SEU APP ID
          allowLocalhostAsSecureOrigin: true,

          notifyButton: {
            enable: true,
            showCredit: false,
            prenotify: true,
            position: 'bottom-right',
            size: 'medium',

            // Traduções COMPLETAS para Português (Corrige o erro de Typescript)
            text: {
              'tip.state.unsubscribed': 'Inscrever-se para ofertas',
              'tip.state.subscribed': 'Você está inscrito!',
              'tip.state.blocked': 'Notificações bloqueadas',
              'message.action.subscribed': 'Obrigado por se inscrever!',
              'message.action.resubscribed': 'Você está inscrito novamente.',
              'message.action.unsubscribed': 'Você não receberá mais notificações.',
              'dialog.main.title': 'Gerenciar Notificações',
              'dialog.main.button.subscribe': 'INSCREVER-SE',
              'dialog.main.button.unsubscribe': 'CANCELAR INSCRIÇÃO',
              'dialog.blocked.title': 'Desbloquear Notificações',
              'dialog.blocked.message': 'Siga as instruções para permitir notificações.',

              // --- AS DUAS QUE FALTAVAM ---
              'message.action.subscribing': 'Inscrevendo-se...',
              'message.prenotify': 'Clique para receber ofertas exclusivas',
            }
          },
        });
      } catch (error) {
        console.log("OneSignal já inicializado ou erro.");
      }
    }
    // ... dentro do useEffect ...
    console.log("🔍 DEBUG: ID do OneSignal:", process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID);

    if (!process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID) {
      console.error("❌ ERRO CRÍTICO: Variável de ambiente vazia!");
    }
    // ...
  }, []);


  return null;
}