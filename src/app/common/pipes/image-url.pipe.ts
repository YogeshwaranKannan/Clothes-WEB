import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'imageUrl',
  standalone: true,
})
export class ImageUrlPipe implements PipeTransform {
  constructor() {}

  transform(value: string): string {
    return "https://dev.fr.api.intellesyde.com/"+ value;
 }
}
