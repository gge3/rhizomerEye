import { Component, OnInit } from '@angular/core';
import { Class } from '../class';
import { ActivatedRoute, Router } from '@angular/router';
import { DatasetService } from '../../dataset/dataset.service';
import { ClassService } from '../class.service';

import * as d3 from 'd3-selection';
import * as d3Cloud from 'd3-cloud';
import * as d3Scale from 'd3-scale';
import * as d3ScaleChromatic from 'd3-scale-chromatic';

@Component({
  selector: 'app-word-cloud',
  templateUrl: './word-cloud.component.html',
  styleUrls: ['./word-cloud.component.css']
})
export class WordCloudComponent implements OnInit {

  datasetId: string;
  classes: Class[] = [];

  private svg;
  private width: number;
  private height: number;
  private fillScale;
  private minFontSize = 18;
  private maxFontSize = 36;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private datasetService: DatasetService,
    private classService: ClassService) {
  }

  ngOnInit() {
    this.datasetId = this.route.snapshot.paramMap.get('did');
    this.loadClassList();
    this.setup();
  }

  loadClassList() {
    this.classService.getAll(this.datasetId).subscribe(
      (classes: Class[]) => {
        this.classes = classes;
        this.populate();
      });
  }

  reloadClassList(): void {
    this.datasetService.clearClasses(this.datasetId).subscribe(
      () => this.loadClassList()
    );
  }

  private setup() {
    this.fillScale = d3Scale.scaleOrdinal(d3ScaleChromatic.schemeCategory10);
    this.svg = d3.select('svg');
    this.width = this.svg.node().getBoundingClientRect().width;
    this.height = window.innerHeight - this.svg.node().getBoundingClientRect().top - 50;
    this.svg = this.svg.attr('height', this.height).append('g')
      .attr('transform', 'translate(' + Math.floor(this.width / 2) + ',' + Math.floor(this.height / 2) + ')');
  }

  private populate() {
    const fontFace = 'Impact';
    const fontWeight = 'bold';
    const spiralType = 'rectangular';

    const maxCount = Math.max(...this.classes.map(c => c.instanceCount), 0);
    const minCount = Math.min(...this.classes.map(c => c.instanceCount), 0);

    d3Cloud()
    .size([this.width, this.height])
    .words(this.classes)
    .padding(3)
    .rotate(() => 0)
    // .rotate(() => Math.floor(Math.random() * 3) * 30 - 30)
    .text(d => d.label)
    .font(fontFace)
    .fontStyle(fontWeight)
    .fontSize(d => ((d.instanceCount - minCount) / (maxCount - minCount)) * this.maxFontSize + this.minFontSize )
    .spiral(spiralType)
    .on('end', () => {
      this.draw();
    })
    .start();
  }

  private draw() {
    this.svg
    .selectAll('text')
    .data(this.classes)
    .enter()
    .append('text')
    .style('font-family', d => d.font)
    .style('font-size', d => d.size + 'px')
    .style('fill', (d, i) => {
      return this.fillScale(i);
    })
    .attr('cursor', 'pointer')
    .attr('text-anchor', 'middle')
    .attr('transform', d => 'translate(' + [d.x, d.y] + ')rotate(' + d.rotate + ')')
    .attr('class', 'word-cloud')
    .attr('title', d => d.uri)
    .text(d => {
      return d.label;
    })
    .on('click', this.browse.bind(this));
  }

  browse(c) {
    this.router.navigate([c.id, 'facets']);
  }
}