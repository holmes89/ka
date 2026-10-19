; Mover: a tiny Atari 2600 test program written for Ka (MIT).
; Joystick left/right moves the block, fire cycles the background colour.
        processor 6502

VSYNC   = $00
VBLANK  = $01
WSYNC   = $02
COLUP0  = $06
COLUBK  = $09
GRP0    = $1B
RESP0   = $10
HMP0    = $20
HMOVE   = $2A
INPT4   = $0C
SWCHA   = $280

BGCOL   = $80
HELD    = $81

        org $F000
Start   sei
        cld
        ldx #$FF
        txs
        lda #0
clear   sta 0,x
        dex
        bne clear
        lda #$1E
        sta COLUP0
        lda #$40
        sta BGCOL
        sta WSYNC
        ldy #12
pos     dey
        bne pos
        sta RESP0

Frame   lda #2
        sta VSYNC
        sta WSYNC
        sta WSYNC
        sta WSYNC
        lda #0
        sta VSYNC
        lda #2
        sta VBLANK
        ldx #37
vblank  sta WSYNC
        dex
        bne vblank

        lda #0
        sta HMP0
        lda SWCHA
        and #$80
        bne notright
        lda #$F0
        sta HMP0
notright lda SWCHA
        and #$40
        bne notleft
        lda #$10
        sta HMP0
notleft sta WSYNC
        sta HMOVE

        lda INPT4
        bmi released
        lda HELD
        bne draw
        lda #1
        sta HELD
        lda BGCOL
        clc
        adc #$20
        sta BGCOL
        jmp draw
released lda #0
        sta HELD

draw    sta WSYNC
        lda #0
        sta VBLANK
        ldx #192
line    sta WSYNC
        lda BGCOL
        sta COLUBK
        txa
        sec
        sbc #96
        cmp #16
        lda #0
        bcs blank
        lda #$FF
blank   sta GRP0
        dex
        bne line

        lda #2
        sta VBLANK
        ldx #29
overscan sta WSYNC
        dex
        bne overscan
        jmp Frame

        org $FFFC
        .word Start
        .word Start
