; Colours: a tiny Atari 8-bit test program written for Ka (MIT).
; Joystick right/left steps the background colour, fire turns it black,
; START makes it blue. Runs once per frame, paced by the OS frame counter.
        processor 6502

RTCLOK  = $14
COLOR2  = $02C6
STICK0  = $0278
STRIG0  = $0284
CONSOL  = $D01F

        org $0600
start   lda STICK0
        and #$08
        bne notright
        inc COLOR2
notright lda STICK0
        and #$04
        bne notleft
        dec COLOR2
notleft lda STRIG0
        bne nofire
        lda #0
        sta COLOR2
nofire  lda CONSOL
        and #$01
        bne nostart
        lda #$84
        sta COLOR2
nostart lda RTCLOK
frame   cmp RTCLOK
        beq frame
        jmp start
