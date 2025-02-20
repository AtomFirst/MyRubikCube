<script setup lang="ts">
import { ref, watch, computed } from "vue";
import useClipboard from 'vue-clipboard3';
import type { Token } from '@/rubik-cube/rubik-cube';
import { Cube3 } from '@/rubik-cube/rubik-cube'
import Cube3List2D from "./Cube3List2D.vue";

// 魔方历史记录
const formula = ref('');

let tokens = new Array<[Token, number]>();
const cube3list = ref([new Cube3()]);

const error = ref(new Array<string>());
const show_history = ref(false);

function onInput(input: string): void {
    const good = (c: string) => {
        switch (c) {
            case 'F': case 'B':
            case 'L': case 'R':
            case 'U': case 'D':
            case 'f': case 'b':
            case 'l': case 'r':
            case 'u': case 'd':
            case 'x': case 'y': case 'z':
            case 'M': case 'S': case 'E':
                return true;
        }
        return false;
    };

    // parse the input formula
    error.value = [];
    const t_tokens = new Array<[Token, number]>();
    for (let i = 0; i < input.length; i++) {
        const c = input[i];
        if (good(c))
            t_tokens.push([c as Token, 1]);
        else if (c === '\'') {
            if (i == 0 || !good(input[i - 1]))
                error.value.push(`第 ${i + 1} 个字符为 '\'' 但前一个字符不是表示转动的字母\n`);
            else
                t_tokens[t_tokens.length - 1][1] = 3;
        }
        else if (c === '2')
            t_tokens[t_tokens.length - 1][1] = t_tokens[t_tokens.length - 1][1] * 2 % 4;
        else if (c !== ' ' && c !== '\n')
            error.value.push(`第 ${i + 1} 个字符 ${c} 不是合法字符\n`);
    }

    // update cube3list
    let i = 0;
    for (; i < t_tokens.length; i++)
        if (i >= tokens.length || tokens[i][0] !== t_tokens[i][0] || tokens[i][1] !== t_tokens[i][1])
            break;
    tokens = t_tokens;
    for (; i < tokens.length; i++) {
        let cur = cube3list.value[i];
        for (let j = 0; j < tokens[i][1]; j++)
            cur = cur.rotate(tokens[i][0]);
        cube3list.value[i + 1] = cur;
    }
    while (cube3list.value.length - 1 > tokens.length)
        cube3list.value.pop();
}

function undoFormula() {
    const last = formula.value.slice(-1);
    formula.value = formula.value.slice(0, -1);
    if (last === '\'' || last === '2' || last === '\n' || last === ' ')
        undoFormula();
}

function scramble() {
    const step = 20;
    const words = 'UDLRFB';
    let str = '';
    for (let i = 0; i < step; i++) {
        const rnd = Math.floor(Math.random() * 6);
        let c = words[rnd];
        if (Math.random() > 0.5)
            c += '\'';
        if (Math.random() > 0.5)
            c += '2';
        str += c + ' ';
    }
    str += '\n';
    formula.value = str;
}

watch(formula, onInput);

// 格式串
const format = computed(() => cube3list.value[cube3list.value.length - 1].format());

const copyText = () => {
    const { toClipboard } = useClipboard();
    toClipboard(format.value);
};

</script>

<template>
    <div class="mydiv">
        <!-- title and input -->
        <div style="display: flex; flex-direction: column; gap: 1em;">
            <!-- title -->
            <h1>大家好啊, 我是<a href="https://github.com/AtomFirst/MyRubikCube">魔方</a></h1>

            <!-- cube's surface deveploment -->
            <Cube3List2D :show_history="show_history" :cube3list="cube3list" class="mobile-only" style="flex: 1;" />

            <!-- keyboard input -->
            <div style="display: flex; gap: 0.3em;">
                <textarea rows="7" cols="50" autofocus placeholder="输入公式（支持符号：
    FBLRUD
    fblrud 
    xyz MSE 
    ' 2
）" v-model="formula" />
                <!--textarea rows="9" cols="12" placeholder="格式串" style="min-width: 6em" readonly :value="format" /-->
            </div>

            <!-- mouse or touch input -->
            <div style="display: flex;">
                <div style="display: grid; grid-template-columns: repeat(6,2.5em);">
                    <button v-for="c in 'FLURDB'" @click="formula += c + ' '">{{ c }} </button>
                    <button v-for="c in 'FLURDB'" @click="formula += c + '\' '">{{ c }}'</button>
                    <button v-for="c in 'FLURDB'" @click="formula += c + '2 '">{{ c }}2</button>
                    <button v-for="c in 'FLURDB'" @click="formula += c + '\'2 '" class="desktop-only">{{ c }}'2</button>

                    <button v-for="c in 'xyzMSE'" @click="formula += c + ' '">{{ c }} </button>
                    <button v-for="c in 'xyzMSE'" @click="formula += c + '\' '">{{ c }}'</button>
                    <button v-for="c in 'xyzMSE'" @click="formula += c + '2 '">{{ c }}2</button>
                    <button v-for="c in 'xyzMSE'" @click="formula += c + '\'2 '" class="desktop-only">{{ c }}'2</button>

                    <button v-for="c in 'flurdb'" @click="formula += c + ' '" class="desktop-only">{{ c }} </button>
                    <button v-for="c in 'flurdb'" @click="formula += c + '\' '" class="desktop-only">{{ c }}'</button>
                    <button v-for="c in 'flurdb'" @click="formula += c + '2 '" class="desktop-only">{{ c }}2</button>
                    <button v-for="c in 'flurdb'" @click="formula += c + '\'2 '" class="desktop-only">{{ c }}'2</button>
                </div>

                <div style="display: flex; flex-direction: column;">
                    <button @click="undoFormula" style="flex: 1;">UNDO</button>
                    <button @click="formula += '\n'" style="flex: 1;">ENTER</button>
                    <button @click="formula = ''" style="flex: 1;">CLEAR</button>
                </div>

                <div style="display: flex; flex-direction: column;">
                    <button @click="copyText" style="flex: 1;">复制文本</button>
                    <button @click="scramble" style="flex: 1;">随机打乱</button>
                    <button @click="show_history = !show_history" style="flex: 1;">
                        <span v-if="show_history">隐藏</span>
                        <span v-else>展示</span>过程
                    </button>
                </div>
            </div>

            <ul style="overflow-y: auto;">
                <li v-for="e in error">{{ e }}</li>
            </ul>
        </div>

        <Cube3List2D :show_history="show_history" :cube3list="cube3list" class="desktop-only" style="flex: 1;" />

    </div>
</template>

<style scoped>
@media (width >=768px) {
    .mobile-only {
        display: none !important;
    }

    h1 {
        font-weight: 500;
        font-size: 2.6rem;
        position: relative;
        top: -10px;
    }
}

@media (width < 768px) {
    .desktop-only {
        display: none !important;
    }

    h1 {
        font-weight: 500;
        font-size: 1.2rem;
        position: relative;
        top: -10px;
        padding: 0;
        margin: 0;
    }
}

.mydiv {
    padding: 1.5em;
    display: flex;
    gap: 2em;
    height: 90vh;
}
</style>
