<script setup lang="ts">
import type { Matrix } from "mathjs";

import * as math from 'mathjs';
import { ref, watch, computed } from "vue";
import useClipboard from 'vue-clipboard3';

// 魔方类
// six directions
const front=math.matrix([1,0,0]);
const back=math.matrix([-1,0,0]);
const left=math.matrix([0,-1,0]);
const right=math.matrix([0,1,0]);
const up=math.matrix([0,0,1]);
const down=math.matrix([0,0,-1]);

// input: a vector
// output: a matrix rotate pi/2 anticlockwise the input vector
// you should not input vector beyond the 6
function vec2mtr(vec:Matrix){
    return math.rotationMatrix(-math.pi/2,vec).map((a,b,c)=>Math.round(a));
}

class Cube{
    rotation:Matrix;
    color:Map<string,string>;
    id:Array<number>;

    constructor(rotation?:Matrix,color?:Map<string,string>,id?:Array<number>){
        this.rotation=rotation?rotation:math.identity(3) as Matrix;
        if(color)
            this.color=color;
        else{
            this.color=new Map();
            this.color.set(front.toString(),'green');
            this.color.set(back.toString(),'blue');
            this.color.set(left.toString(),'orange');
            this.color.set(right.toString(),'red');
            this.color.set(up.toString(),'white');
            this.color.set(down.toString(),'yellow');
        }
        this.id=id?id:[0,0,0];
    }
    copy():Cube{
        return new Cube(this.rotation,new Map(this.color),new Array(...this.id));
    }
    rotate(F:Matrix):Cube{
        return new Cube(math.multiply(F,this.rotation),new Map(this.color),new Array(...this.id));
    }
    // input the 6
    look(angle:Matrix):string|undefined{
        const face=math.multiply(angle,this.rotation).toString();
        return this.color.get(face);
    };
};

class Cube3{
    cubes:Array<Cube>;
    
    constructor(cubes?:Array<Cube>){
        if(cubes){
            this.cubes=cubes;
            return;
        }
        this.cubes=new Array<Cube>(27);
        for(let i=0;i<27;i++)
            this.cubes[i]=new Cube(),
            this.cubes[i].id=Cube3.id2xyz(i);
    }
    copy():Cube3{
        return new Cube3(this.cubes.map(cube=>cube.copy()));
    }
    static xyz2id(x:number,y:number,z:number):number{
        return Math.round(x+y*3+z*9+13);
    }
    static id2xyz(id:number):Array<number>{
        return [Math.floor(id+0.01)%3-1,Math.floor(id/3+0.01)%3-1,Math.floor(id/9+0.01)-1];
    }
    _rotate(f:Matrix,layer:'first'|'middle'|'all'='first'):Cube3{
        //const l=(x:number)=>(first_layer && x!==0)?x:-1;
        //const r=(x:number)=>(first_layer && x!==0)?x:1;
        const l=layer==='first'?
            (x:number)=>(x!==0?x:-1):
            layer==='middle'?
            (x:number)=>(x!==0?0:-1):
            (x:number)=>-1;
        const r=layer==='first'?
            (x:number)=>(x!==0?x:1):
            layer==='middle'?
            (x:number)=>(x!==0?0:1):
            (x:number)=>1;
        const F=vec2mtr(f);

        const res=this.copy();
        for(let x=l(f.get([0]));x<=r(f.get([0]));x++)
        for(let y=l(f.get([1]));y<=r(f.get([1]));y++)
        for(let z=l(f.get([2]));z<=r(f.get([2]));z++){
            const id=Cube3.xyz2id(x,y,z);
            const [nx,ny,nz]=math.multiply(F,[x,y,z]).toArray().map((v,i,a)=>v as number);
            const nid=Cube3.xyz2id(nx,ny,nz);
            res.cubes[nid]=this.cubes[id].rotate(F);
        }
        return res;
    }
    rotate(token:string):Cube3|undefined{
        switch(token){
            case 'F':
                return this._rotate(front);
            case 'B':
                return this._rotate(back);
            case 'L':
                return this._rotate(left);
            case 'R':
                return this._rotate(right);
            case 'U':
                return this._rotate(up);
            case 'D':
                return this._rotate(down);
            
            case 'x':
                return this._rotate(right,'all');
            case 'y':
                return this._rotate(up,'all');
            case 'z':
                return this._rotate(front,'all');
            
            case 'f':
                return this._rotate(front,'all').rotate('B');
            case 'b':
                return this._rotate(back,'all').rotate('F');
            case 'l':
                return this._rotate(left,'all').rotate('R');
            case 'r':
                return this._rotate(right,'all').rotate('L');
            case 'u':
                return this._rotate(up,'all').rotate('D');
            case 'd':
                return this._rotate(down,'all').rotate('U');

            case 'M':
                return this._rotate(right,'middle');
            case 'S':
                return this._rotate(front,'middle');
            case 'E':
                return this._rotate(up,'middle');
        }
    }
    // get color of certain surface
    color(index:number):string{
        const col=(index-1)%12;
        const row=(index-1-col)/12;

        // front
        if(1*3<=row && row<2*3 && 1*3<=col && col<2*3)
            return this.cubes[Cube3.xyz2id(1,col-(1*3+1),(1*3+1)-row)].look(front) as string;
        
        // back
        if(1*3<=row && row<2*3 && 3*3<=col && col<4*3)
            return this.cubes[Cube3.xyz2id(-1,(3*3+1)-col,(1*3+1)-row)].look(back) as string;
        
        // left
        if(1*3<=row && row<2*3 && 0*3<=col && col<1*3)
            return this.cubes[Cube3.xyz2id(col-(0*3+1),-1,(1*3+1)-row)].look(left) as string;

        // right
        if(1*3<=row && row<2*3 && 2*3<=col && col<3*3)
            return this.cubes[Cube3.xyz2id((2*3+1)-col,1,(1*3+1)-row)].look(right) as string;

        // up
        if(0*3<=row && row<1*3 && 1*3<=col && col<2*3)
            return this.cubes[Cube3.xyz2id(row-(0*3+1),col-(1*3+1),1)].look(up) as string;
        
        // down
        if(2*3<=row && row<3*3 && 1*3<=col && col<2*3)
            return this.cubes[Cube3.xyz2id((2*3+1)-row,col-(1*3+1),-1)].look(down) as string;
        
        return '';
    }
    format():string{
        let fmt='';
        for(let i=1;i<=108;i++){
            const c=this.color(i);
            fmt+=c?c[0]:' ';
            if(i!==1 && i!=108 && i%12===0)
                fmt+='\n';
        }
        return fmt;
    }
};

// 魔方历史记录
const formula=ref('');

let tokens=new Array();
const cube3=ref([new Cube3()]);

const error=ref(new Array<string>());
const show_history=ref(false);
const cube3reverse=computed(()=>cube3.value.slice().reverse());

function onInput(input:string):void{
    const good=(c:string)=>{
        switch(c){
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
    error.value=[];
    const t_tokens=[];
    for(let i=0;i<input.length;i++){
        const c=input[i];
        if(good(c))
            t_tokens.push([c,1]);
        else if(c==='\''){
            if(i==0 || !good(input[i-1]))
                error.value.push(`第 ${i+1} 个字符为 '\'' 但前一个字符不是表示转动的字母\n`);
            else
                t_tokens[t_tokens.length-1][1]=3;
        }
        else if(c==='2')
            t_tokens[t_tokens.length-1][1]=(t_tokens[t_tokens.length-1][1] as number)*2%4;
        else if(c!==' ' && c!=='\n')
            error.value.push(`第 ${i+1} 个字符 ${c} 不是合法字符\n`);
    }

    // update cube3
    let i=0;
    for(;i<t_tokens.length;i++)
        if(i>=tokens.length || tokens[i][0]!==t_tokens[i][0] || tokens[i][1]!==t_tokens[i][1])
            break;
    tokens=t_tokens;
    for(;i<tokens.length;i++){
        let cur=cube3.value[i];
        for(let j=0;j<(tokens[i][1] as number);j++)
            cur=cur.rotate(tokens[i][0] as string) as Cube3;
        cube3.value[i+1]=cur;
    }
    while(cube3.value.length-1>tokens.length)
        cube3.value.pop();
}

function undoFormula(){
    const last=formula.value.slice(-1);
    formula.value=formula.value.slice(0,-1);
    if(last==='\'' || last==='2' || last==='\n' || last===' ') 
        undoFormula();
}

function scramble(){
    const step=20;
    const words='UDLRFB';
    let str='';    
    for(let i=0;i<step;i++){
        const rnd=Math.floor(Math.random()*6);
        let c=words[rnd];
        if(Math.random()>0.5)
            c+='\'';
        if(Math.random()>0.5)
            c+='2';
        str+=c+' ';
    }
    str+='\n';
    formula.value=str;
}

watch(formula,onInput);

// 格式串
const format=computed(()=>cube3.value[cube3.value.length-1].format());

const copyText=()=>{
  const {toClipboard}=useClipboard();
  toClipboard(format.value);
};

</script>

<template>
    <div class="mydiv">
        <!-- title and input -->
        <div style="display: flex; flex-direction: column; gap: 1em;">
            <!-- title -->
            <h1>大家好啊, 我是<a href="https://github.com/AtomFirst/MyRubikCube">魔方</a></h1>

            <!-- keyboard input -->
            <div style="display: flex; gap: 0.3em;">
                <textarea rows="7" cols="50" autofocus placeholder=
"输入公式（支持符号：
    FBLRUD
    fblrud 
    xyz MSE 
    ' 2
）" 
                v-model="formula" />
                <!--textarea rows="9" cols="12" placeholder="格式串" style="min-width: 6em" readonly :value="format" /-->
            </div>

                <!-- mouse or touch input -->
            <div style="display: flex;">
                <div style="display: grid; grid-template-columns: repeat(6,2.5em);">
                    <button v-for="c in 'FLURDB'" @click="formula+=c+' '">{{ c }} </button>
                    <button v-for="c in 'FLURDB'" @click="formula+=c+'\' '">{{ c }}'</button>
                    <button v-for="c in 'FLURDB'" @click="formula+=c+'2 '">{{ c }}2</button>
                    <button v-for="c in 'FLURDB'" @click="formula+=c+'\'2 '">{{ c }}'2</button>

                    <button v-for="c in 'xyzMSE'" @click="formula+=c+' '">{{ c }} </button>
                    <button v-for="c in 'xyzMSE'" @click="formula+=c+'\' '">{{ c }}'</button>
                    <button v-for="c in 'xyzMSE'" @click="formula+=c+'2 '">{{ c }}2</button>
                    <button v-for="c in 'xyzMSE'" @click="formula+=c+'\'2 '">{{ c }}'2</button>

                    <button v-for="c in 'flurdb'" @click="formula+=c+' '">{{ c }} </button>
                    <button v-for="c in 'flurdb'" @click="formula+=c+'\' '">{{ c }}'</button>
                    <button v-for="c in 'flurdb'" @click="formula+=c+'2 '">{{ c }}2</button>
                    <button v-for="c in 'flurdb'" @click="formula+=c+'\'2 '">{{ c }}'2</button>
                </div>

                <div style="display: flex; flex-direction: column;">
                    <button @click="undoFormula" style="flex: 1;">UNDO</button>
                    <button @click="formula+='\n'" style="flex: 1;">ENTER</button>
                    <button @click="formula=''" style="flex: 1;">CLEAR</button>
                </div>

                <div style="display: flex; flex-direction: column;">
                    <button @click="copyText" style="flex: 1;">复制文本</button>
                    <button @click="scramble" style="flex: 1;">随机打乱</button>
                    <button @click="show_history=!show_history" style="flex: 1;">
                        <span v-if="show_history">隐藏</span>
                        <span v-else>展示</span>过程
                    </button>
                </div>  
            </div>

            <ul style="overflow-y: auto;">
                <li v-for="e in error">{{ e }}</li>
            </ul>
        </div>

        <!-- cube's surface deveploment -->
        <ul class="list" style="flex: 1;">
            <div v-if="show_history" v-for="(c,i) in cube3reverse">
                <h2>{{ cube3.length-i-1 }}</h2>
                <div class="surface-development">
                    <div v-for="j in 108" :class="['square',c.color(j)]"></div>
                </div>
            </div>
            <div v-else>
                <h2>{{ cube3.length-1 }}</h2>
                <div class="surface-development">
                    <div v-for="j in 108" :class="['square',cube3[cube3.length-1].color(j)]"></div>
                </div>
            </div>
        </ul>
    </div>
</template>

<style scoped>
.surface-development {
    display: grid;
    grid-template-columns: repeat(12, 1em);
    grid-template-rows: repeat(9, 1em);
    gap: 0;
}

.square {
    width: 1em;
    height: 1em;
}

.list {
    list-style-type: none; /* 去掉默认的列表符号 */
    display: grid;
    grid-template-columns: repeat(auto-fill, 12em);
    gap: 3em; /* 可选：设置列表项之间的间距 */
    max-height: 98%;
    overflow-y: auto;
}

::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera */
}

.mydiv {
    padding: 1.5em;
    display: flex;
    gap: 2em;
    height: 90vh;
}

.blue{
    background-color:blue;
}
.orange{
    background-color:orange;
}
.green{
    background-color:green;
}   
.red{
    background-color:red;
}
.white{
    background-color:white;
}
.yellow{
    background-color:yellow;
}

h1 {
    font-weight: 500;
    font-size: 2.6rem;
    position: relative;
    top: -10px;
}

h3 {
    font-size: 1.2rem;
}
</style>
