<script setup lang="ts">
import type { Matrix } from "mathjs";

import * as math from 'mathjs';
import { ref } from "vue";

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
            this.color.set(front.toString(),'orange');
            this.color.set(back.toString(),'red');
            this.color.set(left.toString(),'blue');
            this.color.set(right.toString(),'green_');
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
    rotate(f:Matrix):Cube3{
        const l=(x:number)=>x===0?-1:x;
        const r=(x:number)=>x===0?1:x;
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
    show():string{
        // front
        let front_view='';
        for(let z=1;z>=-1;z--){
            for(let y=-1;y<=1;y++)
                front_view+=`<span class=${this.cubes[Cube3.xyz2id(1,y,z)].look(front)}>  </span>`;
            front_view+='\n';
        }
        // back
        let back_view='';
        for(let z=1;z>=-1;z--){
            for(let y=1;y>=-1;y--)
                back_view+=`<span class=${this.cubes[Cube3.xyz2id(-1,y,z)].look(back)}>  </span>`;
            back_view+='\n';
        }
        // left
        let left_view='';
        for(let z=1;z>=-1;z--){
            for(let x=-1;x<=1;x++)
                left_view+=`<span class=${this.cubes[Cube3.xyz2id(x,-1,z)].look(left)}>  </span>`;
            left_view+='\n';
        }
        // right
        let right_view='';
        for(let z=1;z>=-1;z--){
            for(let x=1;x>=-1;x--)
                right_view+=`<span class=${this.cubes[Cube3.xyz2id(x,1,z)].look(right)}>  </span>`;
            right_view+='\n';
        }
        // up
        let up_view='';
        for(let x=-1;x<=1;x++){
            for(let y=-1;y<=1;y++)
                up_view+=`<span class=${this.cubes[Cube3.xyz2id(x,y,1)].look(up)}>  </span>`;
            up_view+='\n';
        }
        // down
        let down_view='';
        for(let x=1;x>=-1;x--){
            for(let y=-1;y<=1;y++)
                down_view+=`<span class=${this.cubes[Cube3.xyz2id(x,y,-1)].look(down)}>  </span>`;
            down_view+='\n';
        }

        //return front_view+right_view+back_view+left_view+up_view+down_view;
        const u=up_view.split('\n');
        const l=left_view.split('\n');
        const f=front_view.split('\n');
        const r=right_view.split('\n');
        const b=back_view.split('\n');
        const d=down_view.split('\n');

        return '      '+u[0]+'\n'
            +'      '+u[1]+'\n'
            +'      '+u[2]+'\n'
            +l[0]+f[0]+r[0]+b[0]+'\n'
            +l[1]+f[1]+r[1]+b[1]+'\n'
            +l[2]+f[2]+r[2]+b[2]+'\n'
            +'      '+d[0]+'\n'
            +'      '+d[1]+'\n'
            +'      '+d[2]+'\n';
    }
};

const cube3=ref([new Cube3()]);
let tokens=new Array();
const error=ref('');
const show_history=ref(false);

function onInput(event:Event):void{
    const input=(event.target as HTMLInputElement).value as string;
    const good=(c:string)=>{
        switch(c){
            case 'F':
            case 'B':
            case 'L':
            case 'R':
            case 'U':
            case 'D':
                return true;
        }
        return false;
    };
    const f=(c:string)=>{
        switch(c){
            case 'F':
                return front;
            case 'B':
                return back;
            case 'L':
                return left;
            case 'R':
                return right;
            case 'U':
                return up;
            case 'D':
                return down;
        }
    };

    error.value='';
    const t_tokens=[];
    for(let i=0;i<input.length;i++){
        const c=input[i];
        if(good(c))
            t_tokens.push([c,1]);
        else if(c==='\''){
            if(i==0 || !good(input[i-1]))
                error.value+=`第 ${i+1} 个字符为 '\'' 但前一个字符不是表示转动的字母\n`;
            else
                t_tokens[t_tokens.length-1][1]=3;
        }
        else if(c==='2')
            t_tokens[t_tokens.length-1][1]=(t_tokens[t_tokens.length-1][1] as number)*2%4;
        else if(c!==' ' && c!=='\n')
            error.value+=`第 ${i+1} 个字符 ${c} 不是合法字符\n`;
    }

    let i=0;
    for(;i<t_tokens.length;i++)
        if(i>=tokens.length || tokens[i][0]!==t_tokens[i][0] || tokens[i][1]!==t_tokens[i][1])
            break;
    tokens=t_tokens;
    for(;i<tokens.length;i++){
        let cur=cube3.value[i];
        for(let j=0;j<(tokens[i][1] as number);j++)
            cur=cur.rotate(f(tokens[i][0] as string) as Matrix);
        cube3.value[i+1]=cur;
    }
    while(cube3.value.length-1>tokens.length)
        cube3.value.pop();
}

</script>

<template>
  <div>
    <h1>大家好啊，我是魔方</h1>
    
    <textarea rows="10" cols="50" autofocus placeholder="输入公式" @input="onInput" />
    <button @click="show_history=!show_history"><span v-if="show_history">不</span>展示过程</button>
    <pre>{{ error }}</pre>

    <h2>{{ cube3.length-1 }}</h2>
    <pre style="line-height: 95%;" v-html="cube3[cube3.length-1].show()" />

    <div v-if="show_history">
        <ul class="list" v-for="i in cube3.length-1">
            <div>
                <h2>{{ cube3.length-i-1 }}</h2>
                <pre style="line-height: 95%;" v-html="cube3[cube3.length-i-1].show()" />
            </div>
        </ul>
    </div>
  </div>
</template>

<style>
.list {
  list-style-type: none; /* 去掉默认的列表符号 */
  padding: 0;
  margin: 1.5em;
  display: flex; /* 启用 Flexbox 布局 */
  flex-direction: row; /* 从左到右排列（默认值） */
  gap: 10px; /* 可选：设置列表项之间的间距 */
}

div {
    padding: 1.5em;
}

.blue{
    background-color:blue;
}
.orange{
    background-color:orange;
}
.green_{
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
