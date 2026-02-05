; Script para escribir líneas desde un archivo con delay seguro
; Pulsa F1 para iniciar
; Pulsa F2 para detener de emergencia

F1::
    ; CAMBIA ESTO POR LA RUTA REAL DE TU ARCHIVO
    FileSelectFile, SelectedFile, 3, , Selecciona tu archivo de texto, Text Documents (*.txt)
    if SelectedFile =
        return

    Loop, Read, %SelectedFile%
    {
        ; Si el usuario pulsa F2, el script para inmediatamente
        if GetKeyState("F2", "P")
            break

        ; Copia la línea al portapapeles (más rápido y fiable que escribir letra por letra)
        Clipboard := A_LoopReadLine
        
        ; Pega el contenido
        Send, ^v
        Sleep, 100 ; Pequeña pausa para asegurar que se pegó
        
        ; Envía el mensaje
        Send, {Enter}

        ; --- DELAY DE SEGURIDAD ---
        ; Discord tiene un límite de 5 mensajes cada 5 segundos aprox.
        ; Si bajas de 2000ms (2 segundos), te caerá un "Slowmode" o te desconectarán.
        Sleep, 2500 
    }
return

F2::Reload ; Recarga el script para detener el bucle