import type { Matrix } from "mathjs";
import * as math from 'mathjs';

// six directions
export const front=math.matrix([1,0,0]);
export const back=math.matrix([-1,0,0]);
export const left=math.matrix([0,-1,0]);
export const right=math.matrix([0,1,0]);
export const up=math.matrix([0,0,1]);
export const down=math.matrix([0,0,-1]);

// input: a vector
// output: a matrix rotate pi/2 anticlockwise the input vector
// you should not input vector beyond the six directions
export function vec2mtr(vec:Matrix){
    return math.rotationMatrix(-math.pi/2,vec).map((a,b,c)=>Math.round(a));
}

export class Cube{
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

export class Cube3{
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