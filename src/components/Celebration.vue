<script setup>
import { onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  effect: {
    type: String,
    default: 'confetti'
  },
  duration: {
    type: Number,
    default: 2200
  }
})

const emit = defineEmits(['complete'])

const canvasRef = ref(null)
let ctx = null
let particles = []
let rafId = 0
let startTime = 0
let dpr = 1

const palettes = {
  confetti: ['#4f7cff', '#7c5cff', '#17b26a', '#f5a524', '#ff6fa5', '#6ad0ff'],
  stars: ['#ffd447', '#ffb020', '#ffe9a8', '#f5a524', '#fff6d8'],
  hearts: ['#ff6fa5', '#ff4d6d', '#ff8fab', '#ffc2d4', '#e5484d']
}

const symbols = {
  confetti: ['#', '@', '*', '+'],
  stars: ['★'],
  hearts: ['♥', '❤']
}

function random(min, max) {
  return Math.random() * (max - min) + min
}

function createParticle(width, height) {
  const effect = palettes[props.effect] ? props.effect : 'confetti'
  const palette = palettes[effect]
  const shapes = symbols[effect]
  return {
    x: width / 2 + random(-60, 60),
    y: height * 0.42 + random(-20, 20),
    vx: random(-5.2, 5.2),
    vy: random(-9.5, -4.2),
    gravity: random(0.16, 0.28),
    size: random(8, 18),
    rotation: random(0, Math.PI * 2),
    spin: random(-0.18, 0.18),
    color: palette[Math.floor(Math.random() * palette.length)],
    shape: shapes[Math.floor(Math.random() * shapes.length)],
    life: 1,
    decay: random(0.004, 0.009)
  }
}

function resize() {
  const canvas = canvasRef.value
  if (!canvas) return
  dpr = window.devicePixelRatio || 1
  canvas.width = window.innerWidth * dpr
  canvas.height = window.innerHeight * dpr
  canvas.style.width = `${window.innerWidth}px`
  canvas.style.height = `${window.innerHeight}px`
  if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}

function draw() {
  const canvas = canvasRef.value
  if (!canvas || !ctx) return
  const width = canvas.width / dpr
  const height = canvas.height / dpr
  ctx.clearRect(0, 0, width, height)

  particles.forEach((p) => {
    p.x += p.vx
    p.y += p.vy
    p.vy += p.gravity
    p.vx *= 0.995
    p.rotation += p.spin
    p.life -= p.decay

    ctx.save()
    ctx.globalAlpha = Math.max(p.life, 0)
    ctx.translate(p.x, p.y)
    ctx.rotate(p.rotation)
    ctx.fillStyle = p.color
    ctx.font = `bold ${p.size}px var(--font-family, sans-serif)`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(p.shape, 0, 0)
    ctx.restore()
  })

  particles = particles.filter((p) => p.life > 0 && p.y < height + 60)

  const elapsed = performance.now() - startTime
  if (elapsed < props.duration && particles.length > 0) {
    rafId = requestAnimationFrame(draw)
  } else {
    stop()
  }
}

function burst() {
  const canvas = canvasRef.value
  if (!canvas) return
  ctx = canvas.getContext('2d')
  if (!ctx) return
  resize()
  const width = canvas.width / dpr
  const height = canvas.height / dpr
  particles = Array.from({ length: 90 }, () => createParticle(width, height))
  startTime = performance.now()
  cancelAnimationFrame(rafId)
  rafId = requestAnimationFrame(draw)
}

function stop() {
  cancelAnimationFrame(rafId)
  rafId = 0
  particles = []
  if (ctx && canvasRef.value) {
    ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
  }
  emit('complete')
}

function onResize() {
  if (particles.length) resize()
}

watch(
  () => props.visible,
  (value) => {
    if (value) {
      burst()
      window.addEventListener('resize', onResize)
    } else {
      stop()
      window.removeEventListener('resize', onResize)
    }
  }
)

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId)
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <canvas
    v-show="visible"
    ref="canvasRef"
    class="celebration"
    aria-hidden="true"
  ></canvas>
</template>

<style scoped>
.celebration {
  position: fixed;
  inset: 0;
  z-index: var(--z-celebration);
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>