'use client';

import { useEffect } from 'react';
import OneSignal from 'react-onesignal';

export default function OneSignalSetup() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 1. CHUMBE O ID AQUI (Sem usar process.env por enquanto)
      const myAppId = "963cf838-b1dd-4337-a046-34cbb40c0da7"; 

      try {
        OneSignal.init({
          appId: myAppId, 
          // allowLocalhostAsSecureOrigin: true, // <--- COMENTE ESSA LINHA EM PRODUÇÃO
          
          notifyButton: {
            enable: true,
            showCredit: false,
            prenotify: true,
            position: 'bottom-right',
            size: 'medium',
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
              'message.action.subscribing': 'Inscrevendo-se...',
              'message.prenotify': 'Clique para receber ofertas exclusivas',
            }
          },
        });
        
        console.log("✅ OneSignal iniciado com ID Fixo:", myAppId);

      } catch (error) {
        console.error("Erro OneSignal:", error);
      }
    }
  }, []);

  return null;
}